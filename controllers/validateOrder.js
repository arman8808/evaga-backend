import OrderModel from "../modals/order.modal.js";

import Razorpay from "razorpay";
import crypto from "crypto";
import Cart from "../modals/Cart.modal.js";
import addOrderToVendorCalendor from "./vendorCalendor.controller.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { sendEmail } from "../utils/emailService.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const validateOrder = async (req, res) => {
  try {
    const { orderId, paymentId, razorpaySignature } = req.body;
    const userId = req.user?._id;
    console.log(userId, req.user);

    if (!orderId || !paymentId || !razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const order = await OrderModel.findOne({ razorPayOrderId: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const paymentDetails = await razorpay.payments.fetch(paymentId);

    if (paymentDetails.status === "captured") {
      order.status = "CONFIRMED";
      order.paymentStatus = "SUCCESS";
    } else if (paymentDetails.status === "failed") {
      order.status = "CANCELLED";
      order.paymentStatus = "FAILED";
    } else {
      order.status = "PENDING";
      order.paymentStatus = "PENDING";
    }

    await order.save();
    const cart = await Cart.findOneAndDelete({ userId: userId });
    res.json({ success: true, status: order.status });
    if (order.status === "CONFIRMED") {
      const paymentMethodDetails = await razorpay.payments.fetch(paymentId);

      if (paymentMethodDetails) {
        const paymentDetails = {
          method:
            paymentMethodDetails.method === "emi"
              ? "emi"
              : paymentMethodDetails.method,
          details: {}, // Keep it empty except for non-EMI methods
        };

        if (
          paymentMethodDetails.method === "card" &&
          paymentMethodDetails.card
        ) {
          paymentDetails.details = {
            last4: paymentMethodDetails.card.last4,
            network: paymentMethodDetails.card.network,
            type: paymentMethodDetails.card.type,
          };
        } else if (
          paymentMethodDetails.method === "upi" &&
          paymentMethodDetails.upi?.vpa
        ) {
          paymentDetails.details = {
            upiId: paymentMethodDetails.upi.vpa,
          };
        } else if (
          paymentMethodDetails.method === "wallet" &&
          paymentMethodDetails.wallet
        ) {
          paymentDetails.details = {
            walletName: paymentMethodDetails.wallet,
          };
        } else if (
          paymentMethodDetails.method === "netbanking" &&
          paymentMethodDetails.bank
        ) {
          paymentDetails.details = {
            bankName: paymentMethodDetails.bank,
          };
        } else if (paymentMethodDetails.method === "emi") {
          // For EMI, store only the method
          paymentDetails.details = {};
        }

        // Store in the order
        order.paymentDetails = paymentDetails;
        await order.save();
      }

      const invoiceBuffer = await generateInvoice(order);

      const emailResponse = await sendEmail(
        "armanal3066@gmail.com",
        "Your Order Invoice",
        "Thank you for your order! Please find your invoice attached.",
        {
          attachments: [
            {
              filename: `Invoice-${order._id}.pdf`,
              content: invoiceBuffer,
            },
          ],
        }
      );

      console.log("Invoice email sent successfully:", emailResponse);
    }
  } catch (error) {
    console.error("Error validating order:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
