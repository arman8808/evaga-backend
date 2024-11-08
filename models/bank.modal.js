import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Vender",
    },
    accountNumber: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      default: "Current",
      enum: ["Savings", "Current"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BankDetails", bankDetailsSchema);
