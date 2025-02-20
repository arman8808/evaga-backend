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

    // Recalculate GST for each item
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

          let gstRate = 18; // Default GST 18%
          if (gstCategory && gstCategory.gstRates.length > 0) {
            const activeGst =
              gstCategory.gstRates[gstCategory.gstRates.length - 1];
            gstRate = activeGst.gstPercentage || 19;
          }

          gstAmount = (item.totalPrice * gstRate) / 100;
        }

        return { ...item._doc, gstAmount };
      })
    );

    // Recalculate Total GST
    const totalGst = updatedItems.reduce(
      (total, item) => total + item.gstAmount,
      0
    );

    // Get Applied Coupon & Discount from Cart
    const appliedCoupon = cart.appliedCoupon ? cart.appliedCoupon.code : null;
    const discount = cart.appliedCoupon ? cart.appliedCoupon.discount : 0;

    // Final Total Amount After Applying Discount
    const totalAmount = Math.max(
      totalOfCart + platformFee + platformGstAmount + totalGst - discount,
      0
    );

    // Create Cashfree Order
    // const orderId = `ORD_${Date.now()}`;

    // Create Cashfree order
    // const request = {
    //   order_amount: totalAmount,
    //   order_currency: "INR",
    //   order_id: orderId,
    //   customer_details: {
    //     customer_id: userId,
    //     customer_email: "test@example.com",
    //     customer_phone: "9999999999",
    //   },
    //   order_meta: {
    //     return_url: `http://localhost:3000/orderStatus?order_id={order_id}`,
    //   },
    // };

    // const cashfreeResponse = await Cashfree.PGCreateOrder(
    //   "2022-09-01",
    //   request
    // );
    // 1️⃣ Create order on Razorpay
    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save Order to DB
    const newOrder = await OrderModel.create({
      userId,
      items: updatedItems,
      totalAmount,
      platformFee,
      platformGstAmount,
      totalGst,
      appliedCoupon,
      discount,
      razorPayOrderId: order?.id,
      status: "PENDING",
    });

    res.json({
      success: true,
      // payment_session_id: cashfreeResponse?.data?.payment_session_id,
      // order_id: cashfreeResponse?.data?.order_id,
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
