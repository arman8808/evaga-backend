import express from "express";
import {
  createReview,
  deleteReview,
  getReviewById,
  getReviewsByPackageId,
  getReviewsByServiceAndPackage,
  getReviewsByServiceId,
  getReviewsByUserId,
  updateReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/create-review", createReview);
router.get("/service/:serviceId", getReviewsByServiceId);
router.get("/package/:packageId", getReviewsByPackageId);
router.get("/package/:serviceId/:packageId", getReviewsByServiceAndPackage);
router.get("/user/:userId", getReviewsByUserId);
router.get("/:reviewId", getReviewById);
router.put("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;
