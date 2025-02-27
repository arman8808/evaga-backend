import OrderModel from "../modals/order.modal.js";
import GstCategory from "../modals/gstCategory.modal.js";
import Cart from "../modals/Cart.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { razorpay } from "../config/gatewayConfig.js";
import userAddress from "../modals/address.modal.js";
const generateUniqueOrderId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${timestamp}${randomPart}`;
};

const createOrder = async (req, res) => {
  try {
    const { userId } = req.params;
    let { numberOfParts } = req.params;

    numberOfParts = [1, 2, 3].includes(Number(numberOfParts))
      ? Number(numberOfParts)
      : 1;
    const cart = await Cart.findOne({ userId });
    const selectedAddress = await userAddress.findOne({
      userId: userId,
      selected: true,
    });

    if (!cart) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const totalOfCart = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    const platformFee = Math.min((totalOfCart * 2) / 100, 1000);

    let gstPercentage = 18;
    const platformGstAmount = (platformFee * gstPercentage) / 100;

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
            gstRate = activeGst.gstPercentage || 18;
          }
          gstPercentage = gstRate;
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

    const appliedCoupon = cart?.appliedCoupon
      ? cart?.appliedCoupon?.code
      : null;
    const discount = cart?.appliedCoupon ? cart?.appliedCoupon?.discount : 0;

    const totalAmount = parseFloat(
      (
        totalOfCart +
        platformFee +
        platformGstAmount +
        totalGst -
        discount
      ).toFixed(2)
    );

    let partialPayments = [];
    let leftAmount = totalAmount;

    if (numberOfParts === 2) {
      // Calculate 80% and 20% for 2 parts
      const firstPart = Math.floor(totalAmount * 0.8);
      const secondPart = totalAmount - firstPart;

      partialPayments = [
        {
          partNumber: 1,
          amount: firstPart,
          dueDate: new Date(Date.now()), // First part is due immediately
          status: "PAID",
        },
        {
          partNumber: 2,
          amount: secondPart,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          status: "PENDING",
        },
      ];

      leftAmount = secondPart;
    } else if (numberOfParts === 3) {
      // Calculate 50%, 30%, and 20% for 3 parts
      const firstPart = Math.floor(totalAmount * 0.5);
      const secondPart = Math.floor(totalAmount * 0.3);
      const thirdPart = totalAmount - firstPart - secondPart;

      partialPayments = [
        {
          partNumber: 1,
          amount: firstPart,
          dueDate: new Date(Date.now()), // First part is due immediately
          status: "PAID",
        },
        {
          partNumber: 2,
          amount: secondPart,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          status: "PENDING",
        },
        {
          partNumber: 3,
          amount: thirdPart,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Due in 60 days
          status: "PENDING",
        },
      ];

      leftAmount = secondPart + thirdPart;
    } else if (numberOfParts === 1) {
      // Single payment scenario
      partialPayments = [];
      leftAmount = 0;
    }
    const options = {
      amount: Math.round(
        Number(partialPayments[0]?.amount || totalAmount) * 100
      ),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    const newOrder = await OrderModel.create({
      userId,
      items: updatedItems,
      totalAmount,
      platformFee,
      platformGstAmount,
      totalGst,
      appliedCouponAndDiscount: {
        code: appliedCoupon,
        discount: discount,
      },
      discount,
      razorPayOrderId: order?.id,
      OrderId: `ORDER-${generateUniqueOrderId()}`,
      status: "PENDING",
      address: {
        name: selectedAddress.Name,
        address: selectedAddress.address,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        state: selectedAddress.state,
        pinCode: selectedAddress.pinCode,
      },
      partialPayments,
      paymentStatus: numberOfParts > 1 ? "PENDING" : "PENDING",
      leftAmount,
    });

    res.json({
      success: true,
      order_id: order?.id,
      amount: order?.amount,
      currency: "INR",
      partialPayments,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const updateOrder = async (req, res) => {
  try {
    const { orderId, status, paymentStatus } = req.body;

    // Validate input
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    // Create an update object dynamically based on provided fields
    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    // Find the order and update the necessary fields
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { razorPayOrderId: orderId }, // Match by `OrderId`
      { $set: updateFields }, // Update fields
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export { createOrder, updateOrder };
