export const validateOrderRequest = (req, res, next) => {
    const { orderId, orderAmount, customerId, customerEmail, customerPhone } = req.body;
  
    if (!orderId || !orderAmount || !customerId || !customerEmail || !customerPhone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
  
    next();
  };
  