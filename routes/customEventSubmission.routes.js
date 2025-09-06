import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  submitCustomEventForm,
  getAllSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  getSubmissionsByStatus,
  getSubmissionStats,
  deleteSubmission,
  getSubmissionsNeedingAttention
} from "../controllers/customEventSubmission.controller.js";

const router = express.Router();

// ===== PUBLIC ROUTES (NO AUTHENTICATION REQUIRED) =====
// Submit a custom event form - PUBLIC access
router.post("/submit", submitCustomEventForm);

// ===== ADMIN ONLY ROUTES =====
// Get all custom event submissions - ADMIN only
router.get("/", verifyJwt(["admin"]), getAllSubmissions);

// Get submission by ID - ADMIN only
router.get("/:id", verifyJwt(["admin"]), getSubmissionById);

// Update submission status - ADMIN only
router.patch("/:id/status", verifyJwt(["admin"]), updateSubmissionStatus);

// Delete submission (soft delete) - ADMIN only
router.delete("/:id", verifyJwt(["admin"]), deleteSubmission);

// Get submissions by status - ADMIN only
router.get("/status/:status", verifyJwt(["admin"]), getSubmissionsByStatus);

// Get submission statistics - ADMIN only
router.get("/stats/overview", verifyJwt(["admin"]), getSubmissionStats);

// Get submissions needing attention - ADMIN only
router.get("/admin/needing-attention", verifyJwt(["admin"]), getSubmissionsNeedingAttention);

export default router;
