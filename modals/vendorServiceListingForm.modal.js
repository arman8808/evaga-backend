import mongoose from "mongoose";
const ValueSchema = new mongoose.Schema({
  label: { type: String, required: true },
  key: { type: String, required: true },
  type: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
});
const menuSchema = new mongoose.Schema({
  label: { type: String, required: true },
  key: { type: String, required: true },
  type: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
});
const ServiceSchema = new mongoose.Schema({
  menuTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    default: null,
  },
  values: [ValueSchema],
  menu: [menuSchema],
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
    default: null,
  },
  remarks: {
    type: String,
  },
});

const VendorSubmissionSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vender" },
  formTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  Category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  SubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    default: null,
  },
  AbouttheService: { type: String, required: true },
  YearofExperience: { type: String, required: true },
  services: [ServiceSchema],
});

export default mongoose.model(
  "VendorServiceLisitingForm",
  VendorSubmissionSchema
);
