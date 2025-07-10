import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    BannerId: {
      type: String,
      required: true,
    },
    BannerUrl: {
      type: String,
      required: true,
    },
    bannerPreview: {
      type: String,
    },
    altText: { type: String },
    status: {
      type: Boolean,
      default: true,
      required: true,
    },
    forType: {
      type: String,
      enum: ["user", "vendor", "our services", "about1", "about2"],
      default: "vendor",
      required: true,
    },
    categoryId: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
