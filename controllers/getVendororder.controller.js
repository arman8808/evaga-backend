import OrderModel from "../modals/order.modal.js";
import User from "../modals/user.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";
import { sendEmail } from "../utils/emailService.js";

const getVendorNewOrders = async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const vendorOrders = await OrderModel.find({
      "items.vendorId": vendorId,
      "items.orderStatus": "new",
    });

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No orders found for this vendor" });
    }

    const separatedOrders = [];
    for (const order of vendorOrders) {
      const userProfile = await User.findById(order.userId).select(
        "name email phone"
      ); // Adjust fields as per your schema

      for (const item of order.items) {
        if (item.vendorId.toString() === vendorId) {
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

          separatedOrders.push({
            ...item.toObject(),
            orderId: order._id,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            packageDetails: extractedDetails,
            userProfile, // Add user profile here
          });
        }
      }
    }

    return res.status(200).json({ success: true, orders: separatedOrders });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
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
            orderId: order._id,
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

    if (!vendorOrders || vendorOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No orders found for this vendor" });
    }

    return res.status(200).json({ success: true, vendorOrders });
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
            orderId: order._id,
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
            orderId: order._id,
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
            orderId: order._id,
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
};
