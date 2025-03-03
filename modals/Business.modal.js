import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subCategories: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },
});
const businessDetailsSchema = new mongoose.Schema(
  {
    vendorID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Vender",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      default: null,
    },
    typeOfBusiness: {
      type: String,
      enum: [
        "Private Limited",
        "Public Limited",
        "Sole Proprietorship",
        "Partnership",
        "LLP",
        "Others",
      ],
      required: true,
    },
    nameOfApplicant: {
      type: String,
      required: true,
    },
    udyamAadhaar: {
      type: String,
      required: true,
    },
    categoriesOfServices: [categorySchema],
    businessAddress: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
    },
    applicantID: {
      type: String,
      required: true,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    serviceableRadius: {
      type: Number,
      required: true,
    },
    panVerificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending", // Default status
    },
    gstVerificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    adharVerificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending", // Default status
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessDetails", businessDetailsSchema);
