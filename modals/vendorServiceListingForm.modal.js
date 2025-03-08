import mongoose from "mongoose";
const generateUniqueSKU = () => {
  const timestampPart = Date.now().toString().slice(-4);
  const randomPart = Math.floor(10 + Math.random() * 90);
  const sku = `${timestampPart}${randomPart}`;
  return sku;
};

const ServiceSchema = new mongoose.Schema({
  menuTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    default: null,
  },
  cateringTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    default: null,
  },
  cateringValueInVenue: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  cateringPackageVenue: [
    {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  ],
  values: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  menu: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: Boolean,
    required: false,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  packageStatus: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Verified", "Rejected"],
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },
  sku: {
    type: String,
    // required: true,
    unique: true,
    minlength: 6,
    maxlength: 6,
  },
  remarks: {
    type: String,
  },
});

const VendorSubmissionSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);
VendorSubmissionSchema.pre("save", async function (next) {
  const doc = this;

  for (let service of doc.services) {
    if (!service.sku) {
      service.sku = await generateUniqueSKU(
        mongoose.model("VendorServiceLisitingForm")
      );
    }
  }

  next();
});

export default mongoose.model(
  "VendorServiceLisitingForm",
  VendorSubmissionSchema
);
