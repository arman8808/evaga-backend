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
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        packageId: { type: String },
        totalPrice: { type: Number, required: true },
        gstAmount: { type: Number, default: 0 },
        selectedSessions: [
          {
            sessionName: String,
            sessionPrice: Number,
            quantity: Number,
            sessionTotalPrice: Number,
          },
        ],
      },
    ],
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    platformGstAmount: { type: Number, required: true },
    totalGst: { type: Number, required: true },
    appliedCoupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
    cashfreeOrderId: { type: String, required: true },
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
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;
