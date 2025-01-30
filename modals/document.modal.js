import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    vendorID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
      required: true,
    },
    documentId: { type: String, required: true },
    documentName: {
      type: String,
      required: true,
      enum: [
        "gstCertificate",
        "bankStatement",
        "insurance",
        "panCard",
        "certificateOfIncorporation",
        "itrIncomeTax",
        "foodSafetyCertificate",
        "fireLicense",
        "miscellaneous",
      ],
    },
    documentUrl: { type: String, required: true },
    documentType: {
      type: String,
      enum: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
        "image/gif",
        "image/bmp",
        "image/webp",
        "image/tiff",
        "image/x-icon", 
        "image/svg+xml",
        "image/heic", 
        "image/heif",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in process", "verified"],
      default: "pending",
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      default: null,
    },
    verifiedAt: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("venderDocument", documentSchema);
