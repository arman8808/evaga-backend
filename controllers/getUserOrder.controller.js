import OrderModel from "../modals/order.modal.js";

const getUserOrder = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch orders by userId
    const userOrders = await OrderModel.find({ userId });

    if (!userOrders || userOrders.length === 0) {
      return res.status(200).json({ message: "No orders found for this user" });
    }

    // Separate items in each order into individual objects
    const separatedOrders = userOrders.flatMap((order) =>
      order.items.map((item) => ({
        ...item.toObject(), // Convert Mongoose object to plain object
        orderId: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }))
    );

    return res.status(200).json({ success: true, orders: separatedOrders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export { getUserOrder };
