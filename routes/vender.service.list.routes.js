import { Router } from "express";
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
router
  .route("/add-new-service")
  .post(verifyJwt(["vendor", "admin"]), addVenderService);
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
