import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    customer: { type: String, required: true },
    phone: { type: String, required: true },
    booking: { type: String, required: true },
    bookAgain: { type: String, required: true },
    comments: { type: String },
    contact_preference: { type: String, required: true },
    expectations: { type: String },
    experience: { type: String },
    information: { type: String },
    interact: { type: String },
    navigation: { type: String },
    platform: [String],
    rating: { type: String },
    reason: { type: String },
    recommend: { type: String },
    service: { type: String },
    serviceType: [String],
    suggestions: { type: String },
    support: { type: String },
    technical: [String],
    unique: [String],
    vendor: { type: String },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
