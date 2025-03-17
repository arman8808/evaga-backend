import mongoose from "mongoose";
const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        packageId: {
          type: String,
          required: true,
        },
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Vender",
        },
        date: { type: Date },
        time: { type: String },
        pincode: { type: Number },
        defaultPrice: {
          type: Number,
          required: true,
        },
        selectedSessions: [
          {
            sessionName: {
              type: String,
            },
            sessionPrice: {
              type: Number,
              // required: true,
            },
            quantity: {
              type: Number,
              default: 1,
              min: 1,
            },
            sessionTotalPrice: {
              type: Number,
              // required: true,
            },
          },
        ],
        addons: [
          {
            addonId: {
              type: String,
              // required: true,
            },
            addonName: {
              type: String,
              // required: true,
            },
            addonPrice: {
              type: Number,
              // required: true,
            },
          },
        ],
        totalPrice: {
          type: Number,
          required: true,
        },
        itemDiscount: {
          type: Number,
          default: 0,
        },
        finalPrice: {
          type: Number,
          required: false,
        },
        setupCost: {
          type: Number,
          required: false,
          default: 0,
        },
        security: {
          type: Number,
          required: false,
          default: 0,
        },
      },
    ],
    appliedCoupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
const Cart = mongoose.model("Cart", CartSchema);

export default Cart;
