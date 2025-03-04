import bookingModal from "../modals/booking.modal.js";
import { addOrderToCalendar } from "./sendNotificationToCalendar.js";

const addOrderToVendorCalendor = async (bookingData) => {
  const { vendor, startTime, startDate, bookedByVendor, user, address } =
    bookingData;

  try {
    // Validate required fields
    if (!vendor || !startTime || !startDate || (!bookedByVendor && !user)) {
      throw new Error("Missing required fields.");
    }

    // Create a new booking
    const booking = new bookingModal({
      vendor,
      startTime,
      startDate,
      bookedByVendor: bookedByVendor || false, // Defaults to false for user booking
      user: bookedByVendor ? undefined : user, // Include user only if it's a user booking
      address: address && address, // Include user only if it's a user booking
    });

    // Save the booking to the database
    const savedBooking = await booking.save();

    return {
      message: "Booking added to vendor calendar successfully.",
      booking: savedBooking,
    };
  } catch (error) {
    console.error("Error adding booking:", error.message);
    throw new Error("Error adding booking to vendor calendar.");
  }
};
export const checkVendorAvailability = async ({ vendorId, startDate }) => {
  try {
    if (!vendorId || !startDate) {
      return { available: false, message: "Vendor ID and start date are required." };
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate)) {
      return { available: false, message: "Invalid start date format." };
    }

    const isBooked = await bookingModal.findOne({
      vendor: vendorId,
      startDate: parsedStartDate,
      isBooked: true,
    });

    if (isBooked) {
      return { available: false, message: "Vendor is already booked on this date." };
    }

    return { available: true, message: "Vendor is available on this date." };
  } catch (error) {
    console.error("Error checking vendor availability:", error);
    return { available: false, message: "Internal server error." };
  }
};


export default addOrderToVendorCalendor;
