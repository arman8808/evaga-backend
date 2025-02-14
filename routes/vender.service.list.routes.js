import { Router } from "express";
import { upload, uploadAndMoveS3 } from "../middlewares/multer.middleware.js";
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
import {
  //  preprocessFiles,
   processAndTransferFiles } from "../middlewares/PreprocessingMiddleware.js";
    // uploadS3("service", [
    //   "image/png",
    //   "image/jpg",
    //   "image/jpeg",
    //   "image/webp",
    //   "video/mp4",
    //   "video/webm",
    //   "video/ogg",
    //   "video/mov",
    // ]).any([]),
const router = Router();
router
  .route("/add-new-service/:vendorId")
  .post(
    
    uploadAndMoveS3("service", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/mov",
    ]),
    processAndTransferFiles,

    addVenderService
  );
router
  .route("/get-one-service/:serviceId")
  .get(verifyJwt(["vendor", "admin"]), getOneVenderService);
router
  .route("/get-all-service-by-vendorId/:vendorId")
  .get(verifyJwt(["vendor", "admin"]), getAllVenderService);
router.route("/update-one-service/:serviceId").post(
  uploadAndMoveS3("service", [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/mov",
  ]),
  processAndTransferFiles,
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
