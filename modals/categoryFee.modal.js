import mongoose from "mongoose";

const { Schema } = mongoose;
const CategoryFeeSchema = new Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    feesPercentage: { type: Number, required: true, min: 0, max: 100 },
    // minFee: { type: Number, default: 0 },
    // maxFee: { type: Number },
    description: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const CategoryFee = mongoose.model("CategoryFee", CategoryFeeSchema);

export default CategoryFee;
