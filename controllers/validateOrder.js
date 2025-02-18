import { Cashfree } from "cashfree-pg";
import OrderModel from "../modals/order.modal";


export const validateOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });

    // Fetch order details from DB
    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Validate payment status from Cashfree
    const paymentStatus = await Cashfree.Order.fetch(order.cashfreeOrderId);

    if (paymentStatus.order_status === "PAID") {
      order.status = "SUCCESS";
    } else if (paymentStatus.order_status === "FAILED") {
      order.status = "FAILED";
    }

    await order.save();

    res.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Error validating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
