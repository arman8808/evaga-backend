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
  updateVenderBio,
  updateVenderCalender,
  updateVenderProfile,
  updateVenderProfilePicture,
  uploadVendorDocuments,
} from "../controllers/vender.controller.js";
const router = Router();

router.route("/registerVender").post(upload.none(), registerVender);
router.route("/loginVender").post(upload.none(), loginVender);
router
  .route("/updateVender/:userId")
  .put(verifyJwt, upload.none(), updateVenderProfile);
router
  .route("/updateVenderBio/:vendorID")
  .post(verifyJwt, upload.none(), updateVenderBio);
router
  .route("/updateVenderProfilePicture/:vendorID")
  .post(verifyJwt, upload.single("profilePic"), updateVenderProfilePicture);
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
  .post(verifyJwt, upload.single("document"), uploadVendorDocuments);
router
  .route("/updateVenderCalender/:vendorID")
  .post(verifyJwt, upload.single("document"), updateVenderCalender);

export default router;
