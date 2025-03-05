import CategoryFee from "../modals/categoryFee.modal.js";
import OrderModel from "../modals/order.modal.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";

const filterOrdersByItemStatus = async (orderStatus) => {
  const orders = await OrderModel.find().populate({
    path: "userId",
    select: "name email phone",
  });

  const filteredItems = orders.flatMap((order) => {
    const itemsMatchingStatus = order.items
      .filter((item) => item.orderStatus === orderStatus)
      .map((item) => {
        const platformFeePerItem =
          (order.platformFee || 0) / order.items.length;
        const platformGstPerItem =
          (order.platformGstAmount || 0) / order.items.length;

        return {
          OrderId: order.OrderId,
          userId: order.userId,
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus,
          status: order.status,
          address: order.address,
          appliedCouponAndDiscount: order.appliedCouponAndDiscount,
          razorPayOrderId: order.razorPayOrderId,
          paymentDetails: order.paymentDetails,
          updatedAt: order.updatedAt,

          // Item-specific data
          ...item.toObject(),
          platformFee: platformFeePerItem,
          platformGstAmount: platformGstPerItem,
        };
      });

    return itemsMatchingStatus;
  });

  return filteredItems;
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

export const getOneOrderDetail = async (req, res) => {
  const { OrderId, itemId } = req.params;

  try {
    const order = await OrderModel.findOne({ OrderId }).populate({
      path: "userId",
      select: "name email phone",
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const selectedItem = order.items.find(
      (item) => item._id.toString() === itemId
    );

    if (!selectedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in order" });
    }

    const service = await vendorServiceListingFormModal.findById(
      selectedItem.serviceId
    );

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const packageDetails = service?.services.find(
      (pkg) => pkg._id.toString() === selectedItem.packageId.toString()
    );

    let extractedDetails = null;
    if (packageDetails?.values instanceof Map) {
      extractedDetails = {
        Title:
          packageDetails.values.get("Title") ||
          packageDetails.values.get("VenueName") ||
          packageDetails.values.get("FoodTruckName"),
        SKU: packageDetails.get("sku"),
      };
    } else if (packageDetails?.values) {
      extractedDetails = {
        Title:
          packageDetails.values.Title ||
          packageDetails.values.VenueName ||
          packageDetails.values.FoodTruckName,
        SKU: packageDetails.sku,
      };
    }
    const vendor = await Vender.findById(service?.vendorId).select(
      "name email phoneNumber"
    );
    const categoryFee = await CategoryFee.findOne({
      categoryId: service.Category,
    });
    const feesPercentage = categoryFee ? categoryFee.feesPercentage : null;

    const platformFeePerItem = (order.platformFee || 0) / order.items.length;
    const platformGstPerItem =
      (order.platformGstAmount || 0) / order.items.length;

    const response = {
      OrderId: order.OrderId,
      userId: order.userId,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      status: order.status,
      address: order.address,
      appliedCouponAndDiscount: order.appliedCouponAndDiscount,
      razorPayOrderId: order.razorPayOrderId,
      paymentDetails: order.paymentDetails,
      updatedAt: order.updatedAt,

      ...selectedItem.toObject(),
      platformFee: platformFeePerItem,
      platformGstAmount: platformGstPerItem,
      serviceDetails: extractedDetails,
      feesPercentage,
      vendor
    };

    res.status(200).json({ success: true, order: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};
