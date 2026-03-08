import express from "express";
import {
    createTestimonial,
    getAllTestimonialsAdmin,
    getOneTestimonialAdmin,
    updateTestimonial,
    deleteTestimonial,
    getAllTestimonialsForUser,
} from "../controllers/testimonial.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    uploadToS3WithEncoded,
    processImagePreview,
} from "../middlewares/uploadWithEncode.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = express.Router();

// ==================== ADMIN ROUTES ====================
router.post(
    "/create-testimonial",
    verifyJwt(["admin"]),
    uploadToS3WithEncoded("testimonial", [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/webp",
    ], "testimonial"),
    processImagePreview,
    createTestimonial
);
router.get(
    "/get-all-testimonials",
    verifyJwt(["admin"]),
    upload().none(),
    getAllTestimonialsAdmin
);
router.get(
    "/get-one-testimonial/:id",
    verifyJwt(["admin"]),
    upload().none(),
    getOneTestimonialAdmin
);
router.post(
    "/update-testimonial/:id",
    verifyJwt(["admin"]),
    uploadToS3WithEncoded("testimonial", [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/webp",
    ], "testimonial"),
    processImagePreview,
    updateTestimonial
);
router.delete(
    "/delete-testimonial/:id",
    verifyJwt(["admin"]),
    upload().none(),
    deleteTestimonial
);

// ==================== USER / PUBLIC ROUTE ====================
router.get("/get-all-testimonials-for-user", upload().none(), getAllTestimonialsForUser);

export default router;
