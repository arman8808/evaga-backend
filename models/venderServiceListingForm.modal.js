import mongoose from "mongoose";
const VendorSubmissionSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vender" },
  formTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  Category: { type: String, required: true },
  SubCategory: { type: String, required: true },
  AbouttheService: { type: String, required: true },
  YearofExperience: { type: String, required: true },
  services: [
    {
      values: [
        {
          label: { type: String, required: true },
          key: { type: String, required: true },
          type: { type: String, required: true },
          items: mongoose.Schema.Types.Mixed,
        },
      ],
    },
  ],
  status: {
    type: Boolean,
    required: true,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  remarks: {
    type: String,
  },
});

export default mongoose.model(
  "VendorServiceLisitingForm",
  VendorSubmissionSchema
);
