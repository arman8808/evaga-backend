import {
  createBanner,
  deleteBannerById,
  getBannerById,
  getBanners,
  getUserBanners,
  getVendorBanners,
  updateBannerById,
} from "../controllers/banner.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload, uploadToS3 } from "../middlewares/multer.middleware.js";
import express from "express";
const router = express.Router();

router
  .route("/add-banner")
  .post(
    verifyJwt(["admin"]),
    uploadToS3("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("bannerImage"),
    createBanner
  );
router.route("/get-all-banner").get(upload().none(), getBanners);
router.route("/get-user-banner").get(upload().none(), getUserBanners);
router.route("/get-vendor-banner").get(upload().none(), getVendorBanners);
router
  .route("/get-one-banner-by-id/:bannerId")
  .get(verifyJwt(["admin"]), upload().none(), getBannerById);

router
  .route("/update-one-banner/:bannerId")
  .post(
    verifyJwt(["admin"]),
    uploadToS3("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("bannerImage"),
    updateBannerById
  );
router
  .route("/delete-one-banner/:bannerId")
  .delete(verifyJwt(["admin"]), upload().none(), deleteBannerById);
export default router;
