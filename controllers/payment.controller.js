import { createCashfreeOrder } from "../utils/cashfreeUtils.js";

/**
 * Controller to handle order creation
 */
export const createOrderController = async (req, res) => {
  const { orderId, orderAmount, customerId, customerEmail, customerPhone } = req.body;

  if (!orderId || !orderAmount || !customerId || !customerEmail || !customerPhone) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const response = await createCashfreeOrder({
    orderId,
    orderAmount,
    customerId,
    customerEmail,
    customerPhone,
  });

  if (response.success) {
    res.json({ success: true, orderData: response.data });
  } else {
    res.status(500).json({ success: false, error: response.error });
  }
};
