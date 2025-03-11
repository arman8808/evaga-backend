import express from "express";
import { getDistance } from "../controllers/distanceController.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/distance", upload().none(), getDistance);

export default router;
