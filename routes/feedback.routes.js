import { Router } from "express";
import {
  addFeedback,
  getAllFeedback,
  getFeedbackByEmail,
} from "../controllers/feedback.controller.js";

const router = Router();

router.route("/add-feedback").post(addFeedback);
router.route("/get-all-feedback").get(getAllFeedback);
router.route("/get-one-feedback-by-email/:id").get(getFeedbackByEmail);

export default router;
