import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        packageId: { type: String },
        date: { type: Date },
        time: { type: String },
        pincode: { type: Number },
        totalPrice: { type: Number, required: true },
        gstPercentage: { type: Number, required: true },
        gstAmount: { type: Number, default: 0 },
        selectedSessions: [
          {
            sessionName: String,
            sessionPrice: Number,
            quantity: Number,
            sessionTotalPrice: Number,
          },
        ],
        orderStatus: {
          type: String,
          enum: ["new", "confirmed", "active", "completed", "cancelled"],
          default: "new",
        },
        cancelReason: {
          type: String,
        },
        otp: { type: String },
        otpExpiry: { type: Date },
      },
    ],
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    platformGstAmount: { type: Number, required: true },
    totalGst: { type: Number, required: true },
    appliedCouponAndDiscount: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
    razorPayOrderId: { type: String, required: true },
    OrderId: { type: String, required: true },
    address: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      addressLine1: { type: String, required: false },
      addressLine2: { type: String, required: false },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: Number, required: true },
      addressType: { type: String, required: true },
      phone: { type: String, required: true },
      alternatePhone: { type: String, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    partialPayments: [
      {
        partNumber: { type: Number, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        paymentId: { type: String, required: false }, 
        status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
      },
    ],
    paymentDetails: {
      method: { type: String, required: false },
      details: { type: mongoose.Schema.Types.Mixed, required: false },
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;
