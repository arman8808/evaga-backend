import bookingModal from "../modals/booking.modal.js";
import { addOrderToCalendar } from "./sendNotificationToCalendar.js";

const addOrderToVendorCalendor = async (bookingData) => {
  const { vendor, startTime, startDate, bookedByVendor, user, address } =
    bookingData;

  try {
    if (!vendor || !startTime || !startDate || (!bookedByVendor && !user)) {
      throw new Error("Missing required fields.");
    }

    const booking = new bookingModal({
      vendor,
      startTime,
      startDate,
      bookedByVendor: bookedByVendor || false, 
      user: bookedByVendor ? undefined : user, 
      address: address && address, 
    });

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
      return {
        available: false,
        message: "Vendor ID and start date are required.",
      };
    }

    const parsedStartDate = new Date(startDate);
    parsedStartDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(parsedStartDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const isBooked = await bookingModal.findOne({
      vendor: vendorId,
      startDate: { $gte: parsedStartDate, $lt: nextDay },
      isBooked: true,
    });

    if (isBooked) {
      return {
        available: false,
        message: "Vendor is already booked on this date.",
      };
    }

    return { available: true, message: "Vendor is available on this date." };
  } catch (error) {
    console.error("Error checking vendor availability:", error);
    return { available: false, message: "Internal server error." };
  }
};

export default addOrderToVendorCalendor;
