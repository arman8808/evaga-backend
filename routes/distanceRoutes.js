import express from "express";
import { DistanceController } from "../controllers/distanceController.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
  "/calculate-distance",
  upload().none(),
  DistanceController.calculateDistance
);

export default router;
