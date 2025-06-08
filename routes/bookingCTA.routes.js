import express from "express";
import {
  createBooking,
  getBookings,
  markAsRead,
} from "../controllers/bookingCTA.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.post("/bookings", upload().none(), createBooking);

// Admin routes (protect these in production)
router.get("/admin/bookings",upload().none(), getBookings);


export default router;
