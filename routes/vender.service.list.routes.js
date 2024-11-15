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
router.route("/add-new-service").post(verifyJwt, addVenderService);
router.route("/get-one-service").post(verifyJwt, getOneVenderService);
router.route("/get-all-service").post(verifyJwt, getAllVenderService);
router.route("/update-one-service").post(verifyJwt, updateOneVenderService);
router.route("/delete-one-service").post(verifyJwt, deleteVenderService);
router.route("/verify-one-service").post(verifyJwt, VerifyService);

export default router;
