import {
  createBanner,
  deleteBannerById,
  getAboutUsBanners,
  getBannerById,
  getBanners,
  getOurServicesBanners,
  getUserBanners,
  getVendorBanners,
  updateBannerById,
} from "../controllers/banner.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload, uploadToS3 } from "../middlewares/multer.middleware.js";
import express from "express";
import {
  processImagePreview,
  uploadToS3WithEncoded,
} from "../middlewares/uploadWithEncode.middleware.js";
const router = express.Router();

router
  .route("/add-banner")
  .post(
    verifyJwt(["admin"]),
    uploadToS3WithEncoded("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]),
    processImagePreview,
    createBanner
  );
router.route("/get-all-banner").get(upload().none(), getBanners);
router.route("/get-user-banner").get(upload().none(), getUserBanners);
router.route("/get-vendor-banner").get(upload().none(), getVendorBanners);
router
  .route("/get-getOurServicesBanners")
  .get(upload().none(), getOurServicesBanners);
router.route("/get-getAboutUsBanners").get(upload().none(), getAboutUsBanners);
// router.route("/get-getAbout2Banners").get(upload().none(), getAbout2Banners);
router
  .route("/get-one-banner-by-id/:bannerId")
  .get(verifyJwt(["admin"]), upload().none(), getBannerById);

router
  .route("/update-one-banner/:bannerId")
  .post(
    verifyJwt(["admin"]),
    uploadToS3WithEncoded("banner", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]),
    processImagePreview,
    updateBannerById
  );
router
  .route("/delete-one-banner/:bannerId")
  .delete(verifyJwt(["admin"]), upload().none(), deleteBannerById);
export default router;
