import OrderModel from "../modals/order.modal.js";
import GstCategory from "../modals/gstCategory.modal.js";
import Cart from "../modals/Cart.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { razorpay } from "../config/gatewayConfig.js";
const createOrder = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    // Recalculate Platform Fee (2% of cart total, max ₹1000)
    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);

    // Recalculate Platform GST (18% of platform fee)
    const gstPercentage = 18;
    const platformGstAmount = (platformFee * gstPercentage) / 100;

    // Recalculate GST for each item and include date, time, and pincode
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const service = await vendorServiceListingFormModal.findById(
          item.serviceId
        );

        let gstAmount = 0;
        if (service) {
          const gstCategory = await GstCategory.findOne({
            categoryId: service.Category,
          });

          let gstRate = 18;
          if (gstCategory && gstCategory.gstRates.length > 0) {
            const activeGst =
              gstCategory.gstRates[gstCategory.gstRates.length - 1];
            gstRate = activeGst.gstPercentage || 19;
          }

          gstAmount = (item.totalPrice * gstRate) / 100;
        }

        return {
          ...item._doc,
          gstAmount,
          gstPercentage,
          date: item.date,
          time: item.time,
          pincode: item.pincode,
        };
      })
    );

    const totalGst = updatedItems.reduce(
      (total, item) => total + item.gstAmount,
      0
    );

    const appliedCoupon = cart.appliedCoupon ? cart.appliedCoupon.code : null;
    const discount = cart.appliedCoupon ? cart.appliedCoupon.discount : 0;

    const totalAmount = Math.floor(
      totalOfCart + platformFee + platformGstAmount + totalGst - discount,
      0
    );

    const options = {
      amount: Number(totalAmount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save Order to DB
    const newOrder = await OrderModel.create({
      userId,
      items: updatedItems, // Includes date, time, and pincode for each item
      totalAmount,
      platformFee,
      platformGstAmount,
      totalGst,
      appliedCoupon,
      discount,
      razorPayOrderId: order?.id,
      OrderId: `ORDER-${new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
      status: "PENDING",
    });

    res.json({
      success: true,
      order_id: order?.id,
      amount: order?.amount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { createOrder };
