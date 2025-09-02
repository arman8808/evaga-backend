import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  processImagePreview,
  uploadToS3WithEncoded,
  uploadMultipleToS3WithEncoded,
  processMultipleImagePreviews,
} from "../middlewares/uploadWithEncode.middleware.js";
import {
  createCustomEvent,
  updateThemeCardImage,
  getAllCustomEvents,
  getCustomEventById,
  updateCustomEvent,
  toggleActiveStatus,
  deleteCustomEvent,
  getCustomEventsByType,
  validateFormData,
  getTemplateStats,
  getThemeCardImages,
  getPublicActiveEvents,
  getPublicEventById,
  getPublicEventsByType,
  getActiveEventNames,
  getEventDetailsById
} from "../controllers/customEvents.controller.js";

const router = express.Router();

// ===== PUBLIC ACCESS ROUTES (NO AUTHENTICATION REQUIRED) =====
// Get all active custom events for public access
router.get("/public", getPublicActiveEvents);

// Get public custom events by event type
router.get("/public/type/:eventType", getPublicEventsByType);

// Get public custom event template by ID
router.get("/public/:id", getPublicEventById);

// Get all active event names for user selection (no auth required)
router.get("/public/events/names", getActiveEventNames);

// Get event details by ID for user selection (no auth required)
router.get("/public/events/:id", getEventDetailsById);

// ===== ADMIN ONLY ROUTES =====
// Create a new custom event template - ADMINS only
router.post("/", 
  verifyJwt(["admin"]), 
  uploadMultipleToS3WithEncoded("customEvents", [
    "image/png",
    "image/jpg", 
    "image/jpeg",
    "image/webp"
  ]),
  processMultipleImagePreviews,
  createCustomEvent
);

// Update theme card image - ADMINS only
router.put("/:templateId/theme-card/:fieldIndex/:optionIndex/image",
  verifyJwt(["admin"]),
  uploadToS3WithEncoded("customEvents", [
    "image/png",
    "image/jpg",
    "image/jpeg", 
    "image/webp"
  ]),
  processImagePreview,
  updateThemeCardImage
);

// Update custom event template - ADMINS only
router.put("/:id", verifyJwt(["admin"]), updateCustomEvent);

// Toggle active status of custom event template - ADMINS only
router.patch("/:id/toggle-active", verifyJwt(["admin"]), toggleActiveStatus);

// Delete custom event template (soft delete) - ADMINS only
router.delete("/:id", verifyJwt(["admin"]), deleteCustomEvent);

// Get template statistics - ADMINS only
router.get("/stats", verifyJwt(["admin"]), getTemplateStats);

// ===== USER & ADMIN ACCESSIBLE ROUTES =====
// Get all custom event templates (with pagination and filters) - USERS see active only, ADMINS see all
router.get("/", verifyJwt(["user", "admin"]), getAllCustomEvents);

// Get custom events by event type - USERS see active only, ADMINS see all
router.get("/type/:eventType", verifyJwt(["user", "admin"]), getCustomEventsByType);

// Get custom event template by ID - USERS see active only, ADMINS see all
router.get("/:id", verifyJwt(["user", "admin"]), getCustomEventById);

// Get theme card images from a template - USERS see active only, ADMINS see all
router.get("/:id/theme-cards", verifyJwt(["user", "admin"]), getThemeCardImages);

// Get theme card images in specific format - USERS see active only, ADMINS see all
router.get("/:id/theme-cards/:format", verifyJwt(["user", "admin"]), getThemeCardImages);

// Validate form data against a template - USERS and ADMINS can validate
router.post("/validate", verifyJwt(["user", "admin"]), validateFormData);

export default router;
