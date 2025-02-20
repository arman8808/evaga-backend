import OrderModel from "../modals/order.modal.js";

const getUserOrder = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const userOrders = await OrderModel.find({ userId });

    if (!userOrders || userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    return res.status(200).json({ success: true, orders: userOrders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export { getUserOrder };
