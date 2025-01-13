import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true, default: null },
    Category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    SubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    fields: [
      {
        label: { type: String, required: true },
        key: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: [
            "text",
            "number",
            "select",
            "radio",
            "checkbox",
            "textarea",
            "file",
            "object",
            "array",
            "multi-select",
            "option",
            "time",
            "sub-select",
            "sub-multi-select",
          ],
        },
        required: { type: Boolean, default: false },
        options: [String],
        items: [
          {
            type: mongoose.Schema.Types.Mixed,
            default: undefined,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Form", formSchema);
