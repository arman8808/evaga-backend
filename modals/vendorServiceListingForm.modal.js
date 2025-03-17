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

  // Skip sku generation if the document is being updated
  if (!doc.isNew) {
    return next();
  }

  // Generate sku for new services
  for (let service of doc.services) {
    if (!service.sku) {
      service.sku = await generateUniqueSKU(
        mongoose.model("VendorServiceLisitingForm")
      );
    }
  }

  next();
});
VendorSubmissionSchema.pre("updateOne", async function (next) {
  const update = this.getUpdate();

  // Check if services are being updated
  if (update.$set && update.$set.services) {
    // Generate sku for services that don't have one
    for (let service of update.$set.services) {
      if (!service.sku) {
        service.sku = await generateUniqueSKU(
          mongoose.model("VendorServiceLisitingForm")
        );
      }
    }

    // Remove null values for sku
    update.$set.services = update.$set.services.map((service) => {
      if (service.sku === null) {
        delete service.sku; // Remove sku if it's null
      }
      return service;
    });
  }

  next();
});
export default mongoose.model(
  "VendorServiceLisitingForm",
  VendorSubmissionSchema
);
