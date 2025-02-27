import OrderModel from "../modals/order.modal.js";
import User from "../modals/user.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { sendEmail } from "../utils/emailService.js";
import addOrderToVendorCalendor from "./vendorCalendor.controller.js";

const getVendorNewOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
      status: "CONFIRMED",
      paymentStatus: "SUCCESS",
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No new orders found for this vendor" });
    }

    const newOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      );

      for (const item of order.items) {
        // Only process items with 'new' status
        if (
          item.vendorId.toString() === vendorId &&
          item.orderStatus === "new"
        ) {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );

          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            // Extract fields from Map
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
              CoverImage:
                packageDetails.values.get("CoverImage") ||
                packageDetails.values.get("ProductImage")?.[0],
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              FoodTruckName: packageDetails.values.FoodTruckName,
              VenueName: packageDetails.values.VenueName,
              Title: packageDetails.values.Title,
              CoverImage:
                packageDetails.values.CoverImage ||
                packageDetails.values.ProductImage?.[0],
            };
          }
          newOrders.push({
            ...item.toObject(),
            orderId: order.OrderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: item.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      orders: newOrders,
    });
  } catch (error) {
    console.error("Error fetching new vendor orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getVendorconfirmedOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    // Fetch all orders for the vendor
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No confirmed orders found for this vendor" });
    }

    const confirmedOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      ); // Adjust fields as per your schema

      for (const item of order.items) {
        // Only process items with 'confirmed' status
        if (
          item.vendorId.toString() === vendorId &&
          item.orderStatus === "confirmed"
        ) {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );

          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            // Extract fields from Map
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
              CoverImage:
                packageDetails.values.get("CoverImage") ||
                packageDetails.values.get("ProductImage")?.[0],
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              FoodTruckName: packageDetails.values.FoodTruckName,
              VenueName: packageDetails.values.VenueName,
              Title: packageDetails.values.Title,
              CoverImage:
                packageDetails.values.CoverImage ||
                packageDetails.values.ProductImage?.[0],
            };
          }

          // Add confirmed item to the list
          confirmedOrders.push({
            ...item.toObject(),
            orderId: order.OrderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: item.orderStatus, // Should always be 'confirmed'
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile, // Add user profile here
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      orders: confirmedOrders,
    });
  } catch (error) {
    console.error("Error fetching confirmed orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const acceptUserOrder = async (req, res) => {
  const { orderId, id } = req.params;
  try {
    const vendorOrders = await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        "items._id": id,
      },
      {
        $set: { "items.$[elem].orderStatus": "confirmed" },
      },
      {
        arrayFilters: [{ "elem._id": id }],
        new: true,
      }
    );

    if (!vendorOrders) {
      return res
        .status(200)
        .json({ message: "No orders found for this vendor" });
    }

    // Filter the items array to include only the matched item
    const matchedItem = vendorOrders.items.find(
      (item) => item._id.toString() === id
    );

    if (matchedItem) {
      // Prepare data for vendor calendar booking
      const bookingData = {
        vendor: matchedItem.vendorId,
        startTime: matchedItem.time,
        startDate: matchedItem.date,
        bookedByVendor: false,
        user: vendorOrders.userId, // Assuming userId is the booking user
        address: vendorOrders.address, // Add the address from vendorOrders
      };

      // Call addOrderToVendorCalendor as a helper function
      const bookingResult = await addOrderToVendorCalendor(bookingData);

      console.log("Booking response:", bookingResult);
    }

    // Construct the response with only the matched item
    const response = {
      ...vendorOrders.toObject(),
      items: matchedItem ? [matchedItem] : [],
    };

    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const startUserOrder = async (req, res) => {
  const { orderId, id } = req.params;

  try {
    // Generate a random 6-digit OTP and set expiry to 6 hours
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000);

    // Update the order to set the status to "confirmed", and store the OTP and its expiry
    const vendorOrders = await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        "items._id": id,
      },
      {
        $set: {
          "items.$[elem].orderStatus": "confirmed",
          "items.$[elem].otp": otp,
          "items.$[elem].otpExpiry": otpExpiry,
        },
      },
      {
        arrayFilters: [{ "elem._id": id }],
        new: true,
      }
    );

    if (!vendorOrders) {
      return res
        .status(404)
        .json({ message: "No orders found for this vendor" });
    }

    // Fetch the user associated with the order
    const user = await User.findById(vendorOrders?.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send OTP to the user's email
    await sendEmail(
      user.email,
      "OTP for Starting Your Service",
      `Dear Customer,\n\nPlease provide the OTP ${otp} to start your service. This OTP is valid for 6 hours. If you did not request this, please contact our support team immediately.\n\nThank you for choosing our service.\n\nBest regards,\n`
    );

    return res.status(200).json({
      success: true,
      message: "Order confirmed and OTP sent to user email.",
    });
  } catch (error) {
    console.error("Error confirming vendor orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const verifyStart = async (req, res) => {
  const { orderId, id } = req.params;
  const { otp } = req.body;

  try {
    const order = await OrderModel.findOne({
      _id: orderId,
      "items._id": id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const item = order.items.find((item) => item._id.toString() === id);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in the order" });
    }

    if (item.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > new Date(item.otpExpiry)) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    await OrderModel.updateOne(
      {
        _id: orderId,
        "items._id": id,
      },
      {
        $set: {
          "items.$[elem].orderStatus": "active",
        },
        $unset: {
          "items.$[elem].otp": "",
          "items.$[elem].otpExpiry": "",
        },
      },
      {
        arrayFilters: [{ "elem._id": id }],
      }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Order started.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getVendorActiveOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    // Fetch all orders for the vendor
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No active orders found for this vendor" });
    }

    const activeOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      ); // Adjust fields as per your schema

      for (const item of order.items) {
        // Only process items with 'active' status
        if (
          item.vendorId.toString() === vendorId &&
          item.orderStatus === "active"
        ) {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );

          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            // Extract fields from Map
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
              CoverImage:
                packageDetails.values.get("CoverImage") ||
                packageDetails.values.get("ProductImage")?.[0],
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              FoodTruckName: packageDetails.values.FoodTruckName,
              VenueName: packageDetails.values.VenueName,
              Title: packageDetails.values.Title,
              CoverImage:
                packageDetails.values.CoverImage ||
                packageDetails.values.ProductImage?.[0],
            };
          }

          // Add active item to the list
          activeOrders.push({
            ...item.toObject(),
            orderId: order.OrderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: item.orderStatus, // Should always be 'active'
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile, // Add user profile here
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      orders: activeOrders,
    });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const endUserOrder = async (req, res) => {
  const { orderId, id } = req.params;

  try {
    // Generate a random 6-digit OTP and set expiry to 6 hours
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000);

    // Update the order to set the OTP and its expiry for ending the service
    const vendorOrders = await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        "items._id": id,
      },
      {
        $set: {
          "items.$[elem].otp": otp,
          "items.$[elem].otpExpiry": otpExpiry,
        },
      },
      {
        arrayFilters: [{ "elem._id": id }],
        new: true,
      }
    );

    if (!vendorOrders) {
      return res
        .status(404)
        .json({ message: "No orders found for this vendor" });
    }

    // Fetch the user associated with the order
    const user = await User.findById(vendorOrders?.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send OTP to the user's email
    await sendEmail(
      user.email,
      "OTP for Ending Your Service",
      `Dear Customer,\n\nPlease provide the OTP ${otp} to end your service. This OTP is valid for 6 hours. If you did not request this, please contact our support team immediately.\n\nThank you for choosing our service.\n\nBest regards,\n`
    );

    return res.status(200).json({
      success: true,
      message: "End-service OTP sent to user email.",
    });
  } catch (error) {
    console.error("Error sending end-service OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const verifyEndService = async (req, res) => {
  const { orderId, id } = req.params;
  const { otp } = req.body;

  try {
    const order = await OrderModel.findOne({
      _id: orderId,
      "items._id": id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const item = order.items.find((item) => item._id.toString() === id);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in the order" });
    }

    if (item.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > new Date(item.otpExpiry)) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    await OrderModel.updateOne(
      {
        _id: orderId,
        "items._id": id,
      },
      {
        $set: {
          "items.$[elem].orderStatus": "completed",
        },
        $unset: {
          "items.$[elem].otp": "",
          "items.$[elem].otpExpiry": "",
        },
      },
      {
        arrayFilters: [{ "elem._id": id }],
      }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Service ended.",
    });
  } catch (error) {
    console.error("Error verifying end-service OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getAllCompletedOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No completed orders found for this vendor" });
    }

    const completedOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      );

      for (const item of order.items) {
        if (
          item.vendorId.toString() === vendorId &&
          item.orderStatus === "completed"
        ) {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );

          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
              CoverImage:
                packageDetails.values.get("CoverImage") ||
                packageDetails.values.get("ProductImage")?.[0],
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              FoodTruckName: packageDetails.values.FoodTruckName,
              VenueName: packageDetails.values.VenueName,
              Title: packageDetails.values.Title,
              CoverImage:
                packageDetails.values.CoverImage ||
                packageDetails.values.ProductImage?.[0],
            };
          }

          completedOrders.push({
            ...item.toObject(),
            orderId: order.OrderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: item.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      orders: completedOrders,
    });
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const getAllCancelledOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No cancelled orders found for this vendor" });
    }

    const cancelledOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      );

      for (const item of order.items) {
        if (
          item.vendorId.toString() === vendorId &&
          item.orderStatus === "cancelled"
        ) {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );

          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
              CoverImage:
                packageDetails.values.get("CoverImage") ||
                packageDetails.values.get("ProductImage")?.[0],
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              FoodTruckName: packageDetails.values.FoodTruckName,
              VenueName: packageDetails.values.VenueName,
              Title: packageDetails.values.Title,
              CoverImage:
                packageDetails.values.CoverImage ||
                packageDetails.values.ProductImage?.[0],
            };
          }

          cancelledOrders.push({
            ...item.toObject(),
            orderId: order.OrderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: item.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      orders: cancelledOrders,
    });
  } catch (error) {
    console.error("Error fetching cancelled orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const cancelOrder = async (req, res) => {
  const { orderId, itemId, cancelReason } = req.body;

  if (!orderId || !itemId || !cancelReason) {
    return res.status(400).json({
      success: false,
      message: "Order ID, Item ID, and cancel reason are required",
    });
  }

  try {
    const order = await OrderModel.findOne({ OrderId: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in the order",
      });
    }

    item.orderStatus = "cancelled";
    item.cancelReason = cancelReason;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order item cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getOneOrderDetails = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;

    const order = await OrderModel.findOne({
      OrderId: orderId,
      "items._id": itemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in the order" });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const service = await vendorServiceListingFormModal.findById(
      item.serviceId
    );

    const packageDetails = service?.services.find(
      (pkg) => pkg._id.toString() === item.packageId.toString()
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

    const numberOfItems = order.items.length;
    const platformFeePerItem = (order.platformFee / numberOfItems).toFixed(2);
    const platformGstPerItem = (
      order.platformGstAmount / numberOfItems
    ).toFixed(2);
    // Construct the response
    const response = {
      OrderId: order.OrderId,
      createdAt: order.createdAt,
      razorPayOrderId: order.razorPayOrderId,
      address: order.address,
      itemDetails: item,
      userName: user.name,
      platformFeePerItem: parseFloat(platformFeePerItem),
      platformGstPerItem: parseFloat(platformGstPerItem),
      extractedDetails: extractedDetails,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while fetching order details",
      error: error.message,
    });
  }
};

export {
  getVendorNewOrders,
  getVendorconfirmedOrders,
  acceptUserOrder,
  startUserOrder,
  verifyStart,
  getVendorActiveOrders,
  endUserOrder,
  verifyEndService,
  getAllCompletedOrders,
  getAllCancelledOrders,
  cancelOrder,
  getOneOrderDetails,
};
