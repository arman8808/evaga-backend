import OrderModel from "../modals/order.modal.js";

export const getAllNewOrder = async (req, res) => {
  try {
    const orders = await OrderModel.find({ orderStatus: "new" })
      .populate({ path: "userId", select: "name" }) 
      .sort({ createdAt: -1 });

    console.log(orders);

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch new orders",
      error: error.message,
    });
  }
};

export const getAllConfirmedOrder = async (req, res) => {
  try {
    const orders = await OrderModel.find({ status: "CONFIRMED" });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch confirmed orders",
      error: error.message,
    });
  }
};

export const getAllOngoingOrder = async (req, res) => {
  try {
    const orders = await OrderModel.find({ orderStatus: "active" });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing orders",
      error: error.message,
    });
  }
};

export const getAllCompletedOrder = async (req, res) => {
  try {
    const orders = await OrderModel.find({ orderStatus: "completed" });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders",
      error: error.message,
    });
  }
};

export const getAllCancelledOrder = async (req, res) => {
  try {
    const orders = await OrderModel.find({ orderStatus: "cancelled" });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled orders",
      error: error.message,
    });
  }
};
