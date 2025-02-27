import mongoose from "mongoose";
const generateUniqueSKU = async (model) => {
  let sku;
  let isUnique = false;
  while (!isUnique) {
    sku = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit number
    const existingDoc = await model.findOne({ "services.sku": sku });
    if (!existingDoc) {
      isUnique = true;
    }
  }
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
