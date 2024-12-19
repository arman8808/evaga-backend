import {
  createBanner,
  deleteBannerById,
  getBanners,
  updateBannerById,
} from "../controllers/banner.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import express from "express";
const router = express.Router();

router
  .route("/add-banner")
  .post(
    upload("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("bannerImage"),
    createBanner
  );
router.route("/get-all-banner").get(upload().none(), getBanners);

router
  .route("/update-one-banner/:bannerId")
  .put(
    upload("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("bannerImage"),
    updateBannerById
  );
router.route("/delete-one-banner/:bannerId").delete(upload().none(), deleteBannerById);
export default router;
