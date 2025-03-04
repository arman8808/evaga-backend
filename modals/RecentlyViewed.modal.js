import mongoose from "mongoose";

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        packageId: {
          type: String,
          required: true,
        },
        serviceId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const RecentlyViewed = mongoose.model("RecentlyViewed", recentlyViewedSchema);
export default RecentlyViewed;
