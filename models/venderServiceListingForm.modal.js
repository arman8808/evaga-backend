import mongoose from "mongoose";
const VendorSubmissionSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vender" },
  formTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  Category: { type: String, required: true },
  SubCategory: { type: String, required: true },
  AbouttheService: { type: String, required: true },
  YearofExperience: { type: String, required: true },
  values: [
    {
      type: mongoose.Schema.Types.Mixed,
    },
  ],
});

export default mongoose.model(
  "VendorServiceLisitingForm",
  VendorSubmissionSchema
);
