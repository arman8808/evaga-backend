import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  changeVenderPassword,
  deleteVenderAccount,
  getOneVenderProfile,
  loginVender,
  logoutVender,
  registerVender,
  updateVenderBankDetails,
  updateVenderProfile,
  uploadVendorDocuments,
} from "../controllers/vender.controller.js";
const router = Router();

router.route("/registerVender").post(upload.none(), registerVender);
router.route("/loginVender").post(upload.none(), loginVender);
router
  .route("/updateVender/:userId")
  .put(verifyJwt, upload.none(), updateVenderProfile);
router
  .route("/getVenderProfile/:userId")
  .get(verifyJwt, upload.none(), getOneVenderProfile);
router
  .route("/changeVenderPassword/:userId")
  .put(verifyJwt, upload.none(), changeVenderPassword);
router
  .route("/deleteVenderProfile/:userId")
  .delete(verifyJwt, upload.none(), deleteVenderAccount);
router
  .route("/logoutVender/:userId")
  .post(verifyJwt, upload.none(), logoutVender);
router
  .route("/updateVendorBankDetails")
  .post(verifyJwt, upload.none(), updateVenderBankDetails);
router
  .route("/uploadVendorDocuments")
  .post(verifyJwt, upload.single('document'), uploadVendorDocuments);

export default router;
