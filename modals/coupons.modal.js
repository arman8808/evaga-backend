import mongoose from "mongoose";

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
      default: null,
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
      type: Number,
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
    applyAutoCoupon: {
      type: Boolean,
      default: false,
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
