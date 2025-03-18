import { Parser } from "json2csv";
import CategoryFee from "../modals/categoryFee.modal.js";
import OrderModel from "../modals/order.modal.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";

const filterOrdersByItemStatus = async (orderStatus, fromDate, toDate) => {
  const query = {};

  if (fromDate && toDate) {
    query.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  const orders = await OrderModel.find(query).populate({
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
          ...item.toObject(),
          platformFee: platformFeePerItem,
          platformGstAmount: platformGstPerItem,
        };
      });

    return itemsMatchingStatus;
  });

  return filteredItems;
};

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
      vendor,
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

export const downloadOrdersCSV = async (req, res) => {
  try {
    const { orderStatus } = req.params;
    const { fromDate, toDate } = req.query;
    const filteredOrders = await filterOrdersByItemStatus(
      orderStatus,
      fromDate,
      toDate
    );

    if (filteredOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No orders found with status: ${orderStatus}`,
      });
    }
    const fields = [
      "OrderId",
      "userId.name",
      "userId.email",
      "userId.phone",
      "createdAt",
      "paymentStatus",
      "status",
      "address",
      "appliedCouponAndDiscount",
      "razorPayOrderId",
      "paymentDetails",
      "updatedAt",
      "itemName",
      "quantity",
      "price",
      "orderStatus",
      "platformFee",
      "platformGstAmount",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(filteredOrders);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${orderStatus}_orders.csv`
    );

    res.status(200).end(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV",
      error: error.message,
    });
  }
};
