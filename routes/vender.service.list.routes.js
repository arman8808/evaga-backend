import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  addVenderService,
  deleteVenderService,
  getAllVenderService,
  getOneVenderService,
  updateOneVenderService,
  VerifyService,
} from "../controllers/vender.service.form.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/add-new-service").post(
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
  addVenderService
);
router
  .route("/get-one-service")
  .post(verifyJwt(["vendor", "admin"]), getOneVenderService);
router
  .route("/get-all-service")
  .post(verifyJwt(["vendor", "admin"]), getAllVenderService);
router
  .route("/update-one-service")
  .post(verifyJwt(["vendor", "admin"]), updateOneVenderService);
router
  .route("/delete-one-service")
  .post(verifyJwt(["vendor", "admin"]), deleteVenderService);
router.route("/verify-one-service").post(verifyJwt(["admin"]), VerifyService);

export default router;
