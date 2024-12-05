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
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
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
        return !this.bookedByVendor;
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("BookingCalender", bookingSchema);
