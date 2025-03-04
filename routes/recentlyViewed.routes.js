import express from "express";
import {
  addToRecentlyViewed,
  getRecentlyViewed,
} from "../controllers/recentlyViewed.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
  "/add-recent-view",
  verifyJwt(["user", "admin"]),
  upload().none(),
  addToRecentlyViewed
);

router.get(
  "/get-recent-view/:userId",
  verifyJwt(["user", "admin"]),
  upload().none(),
  getRecentlyViewed
);

export default router;
