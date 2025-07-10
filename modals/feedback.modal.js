import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    bookingProcess: { type: Number, required: true, min: 1, max: 5 },
    customerCare: { type: Number, required: true, min: 1, max: 5 },
    eventExecution: { type: Number, required: true, min: 1, max: 5 },
    eventType: { type: String, required: true },
    heardAbout: { type: String, required: true },
    pricingClarity: { type: Number, required: true, min: 1, max: 5 },
    recommend: { type: String, required: true },
    responseTime: { type: Number, required: true, min: 1, max: 5 },
    suggestions: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
