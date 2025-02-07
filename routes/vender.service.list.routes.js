import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadS3 } from "../middlewares/multer.middleware.js";
import {
  addVenderService,
  authenticateYouTube,
  deleteVenderService,
  getAllVenderService,
  getOneVenderService,
  updateOneVenderService,
  VerifyService,
} from "../controllers/vendor.service.form.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { preprocessFiles } from "../middlewares/PreprocessingMiddleware.js";
const router = Router();
router
  .route("/add-new-service/:vendorId")
  .post(

    uploadS3("service", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/mov",
    ]).any([]),
    preprocessFiles,
    addVenderService
  );
router
  .route("/get-one-service/:serviceId")
  .get(verifyJwt(["vendor", "admin"]), getOneVenderService);
router
  .route("/get-all-service-by-vendorId/:vendorId")
  .get(verifyJwt(["vendor", "admin"]), getAllVenderService);
router.route("/update-one-service/:serviceId").post(
  upload("service", [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/mov",
  ]).any([
    // { name: "CoverImage", maxCount: 1 },
    // { name: "Portfolio", maxCount: 20 },
  ]),
  updateOneVenderService
);
router
  .route("/delete-one-service/:serviceId/:packageId")
  .delete(deleteVenderService);
router
  .route("/verify-one-service/:serviceId/:packageid")
  .post(upload().none(), verifyJwt(["admin"]), VerifyService);
router.route("/authenticateYouTube").get(upload().none(), authenticateYouTube);

export default router;
