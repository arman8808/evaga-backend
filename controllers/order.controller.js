import OrderModel from "../modals/order.modal.js";



// Helper function to filter orders based on item-level status
const filterOrdersByItemStatus = async (orderStatus) => {
  const orders = await OrderModel.find().populate({
    path: "userId",
    select: "name email phone",
  });

  const filteredOrders = [];
  for (const order of orders) {
    const itemsMatchingStatus = order.items.filter(
      (item) => item.orderStatus === orderStatus
    );

    if (itemsMatchingStatus.length > 0) {
      filteredOrders.push({
        ...order.toObject(),
        items: itemsMatchingStatus,
      });
    }
  }

  return filteredOrders;
};

// Get all new orders
export const getAllNewOrder = async (req, res) => {
  try {
    const orders = await filterOrdersByItemStatus("new");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch new orders",
      error: error.message,
    });
  }
};

// Get all confirmed orders
export const getAllConfirmedOrder = async (req, res) => {
  try {
    const orders = await filterOrdersByItemStatus("confirmed");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch confirmed orders",
      error: error.message,
    });
  }
};

// Get all ongoing orders
export const getAllOngoingOrder = async (req, res) => {
  try {
    const orders = await filterOrdersByItemStatus("active");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing orders",
      error: error.message,
    });
  }
};

// Get all completed orders
export const getAllCompletedOrder = async (req, res) => {
  try {
    const orders = await filterOrdersByItemStatus("completed");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders",
      error: error.message,
    });
  }
};

// Get all cancelled orders
export const getAllCancelledOrder = async (req, res) => {
  try {
    const orders = await filterOrdersByItemStatus("cancelled");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled orders",
      error: error.message,
    });
  }
};
