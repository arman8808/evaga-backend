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
// Example usage:
const orderDetails = {
  orderId: "12345",
  description: "Order of electronics",
  date: "2025-02-25T10:00:00",
};
// addOrderToCalendar(orderDetails, "armanal3066@gmail.com");
export default addOrderToVendorCalendor;
