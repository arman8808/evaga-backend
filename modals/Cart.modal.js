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

        defaultPrice: {
          type: Number,
          required: true,
        },
        selectedSessions: [
          {
            sessionName: {
              type: String,
              required: true,
            },
            sessionPrice: {
              type: Number,
              required: true,
            },
            quantity: {
              type: Number,
              default: 1,
              min: 1,
            },
            sessionTotalPrice: {
              type: Number,
              required: true,
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
