import bookingCTA from "../modals/bookingCTA.js";
import sendEmailWithTemplete from "../utils/mailer.js";
import { sendTemplateMessage } from "./wati.controller.js";
// Create new booking
export const createBooking = async (req, res) => {
  try {
    const booking = await bookingCTA.create(req.body);
    res.status(201).json({
      success: true,
      data: booking,
    });
    await sendEmailWithTemplete(
      "thankyou",
      booking?.email,
      "Thank You for Reaching Out to Eevagga!"
    );
    await sendEmailWithTemplete(
      "adminCtaNotification",
      "info@evagaentertainment.com",
      "New Booking Form Submission - Eevagga",
      {
        name: booking?.name,
        email: booking?.email,
        phone: booking?.phone,
        eventType: booking?.eventType,
        preferredDate: booking?.preferredDate,
        pageCatgeory: booking?.pageCatgeory,
      }
    );
    await sendTemplateMessage(booking?.phone, "form_filling_enquiry_res", []);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all bookings (for admin)
export const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let query = {};

    // Add search functionality for phone and email
    if (search) {
      query = {
        $or: [
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const bookings = await bookingCTA
      .find(query)
      .sort({ createdAt: -1 }) 
      .limit(limit * 1)
      .skip((page - 1) * limit)
    

    const count = await bookingCTA.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Mark as read (admin)
export const markAsRead = async (req, res) => {
  try {
    const booking = await BookingCTA.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
