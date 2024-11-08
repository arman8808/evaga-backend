import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    vendorID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
      required: true,
    },
    documentName: { type: String, required: true },
    documentUrl: { type: String, required: true },
    documentType: {
      type: String,
      enum: ["image/jpeg", "image/png", "application/pdf"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in process", "verified"],
      default: "pending",
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
