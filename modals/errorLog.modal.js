import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "Global Error",
        "Unhandled Rejection",
        "Network Error",
        "Component Error",
      ],
    },
    message: { type: String, required: true },
    source: { type: String },
    lineno: { type: Number },
    colno: { type: Number },
    error: { type: String },
    url: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ErrorLog = mongoose.model("ErrorLog", errorLogSchema);

export default ErrorLog;
