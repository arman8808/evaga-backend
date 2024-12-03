import mongoose from "mongoose";

const MenuSchema = new mongoose.Schema({
  Category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  SubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    default: null,
  },
  associatedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "entityModel",
    default: null,
  },
  entityModel: {
    type: String,
    enum: ["Venue", "Service", "Catering"],
  },
  fields: [
    {
      key: { type: String, required: true },
      label: { type: String, required: true },
      value: mongoose.Schema.Types.Mixed,
      type: { type: String, required: true },
      items: { type: mongoose.Schema.Types.Mixed, default: [] },
      isRequired: { type: Boolean, default: false },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Menu = mongoose.model("Menu", MenuSchema);
