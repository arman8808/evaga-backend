import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // If booked by vendor, endDate must be provided
          if (this.bookedByVendor && !value) {
            return false;
          }
          return true;
        },
        message: "End date is required when the vendor is blocking the calendar.",
      },
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      validate: {
        validator: function (value) {
          // If booked by vendor, endTime is required
          if (this.bookedByVendor && !value) {
            return false;
          }
          // If booked by user, endTime is optional (can be null or empty)
          if (!this.bookedByVendor && value === undefined) {
            return true;
          }
          return true;
        },
        message: "End time is required when the vendor is blocking the calendar.",
      },
    },
    isBooked: {
      type: Boolean,
      default: true,
    },
    bookedByVendor: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.bookedByVendor; // User is required if not booked by vendor
      },
    },
    address: {
      name: { type: String, required: false },
      address: { type: String, required: false },
      addressLine1: { type: String, required: false },
      addressLine2: { type: String, required: false },
      state: { type: String, required: false },
      pinCode: { type: Number, required: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("BookingCalender", bookingSchema);
