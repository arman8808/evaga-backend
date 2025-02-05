import mongoose from "mongoose";

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number, // Fixed discount amount (e.g., 1000)
      default: null,
    },
    discountPercentage: {
      type: Number, 
      min: 0,
      max: 100,
      default: null,
    },
    cap: {
      type: Number, 
      default: null,
    },
    usersUsed: {
      type: Map,
      of: {
        userId: { type: String, required: true },
        email: { type: String, required: true },
        usageCount: { type: Number, default: 0 },
      },
      default: {},
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
