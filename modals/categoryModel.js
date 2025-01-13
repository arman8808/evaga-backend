import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    status:{
      type: Boolean,
      default: true,
      required: true,
    }
  },
  { timestamps: true }
);

const SubCategory = mongoose.model("SubCategory", subCategorySchema);


const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: false,
    },
    status:{
      type: Boolean,
      default: true,
      required: true,
    }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export { Category, SubCategory };
