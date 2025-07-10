import mongoose from "mongoose";

const bookingCTASchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Invalid phone number",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        "Invalid email address",
      ],
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: ["Weddings", "Corporate", "Baby Showers", "Birthdays", "Others"],
    },
    pageCatgeory: {
      type: String,
    },
    preferredDate: {
      type: Date,
      // required: [true, "Preferred date is required"],
    },
    eventMonth: {
      type: String,
      required: [true, "Preferred date is required"],
    },
    eventLocation: {
      type: String,
      required: [true, "Preferred date is required"],
    },
    sku: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BookingCTA", bookingCTASchema);
