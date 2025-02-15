import mongoose from "mongoose";

const GstRateSchema = new mongoose.Schema(
  {
    gstPercentage: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  { _id: false }
);

const GstCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryName: { type: String, required: true },
    gstRates: { type: [GstRateSchema], required: true },
  },
  { timestamps: true }
);

const GstCategory = mongoose.model("GstCategory", GstCategorySchema);

export default GstCategory;
