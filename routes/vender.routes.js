import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  addNewCategoryvenderBusinessDeatils,
  changeVenderPassword,
  deleteVenderAccount,
  getOneVenderProfile,
  getVendorProfilePercentage,
  loginVender,
  logoutVender,
  registerVender,
  updateVenderBankDetails,
  updateVenderBio,
  updateVenderCalender,
  updateVenderProfile,
  updateVenderProfilePicture,
  uploadVenderBusinessDetails,
  uploadVendorDocuments,
} from "../controllers/vender.controller.js";
const router = Router();

router.route("/registerVender").post(upload().none(), registerVender);
router.route("/loginVender").post(upload().none(), loginVender);
router
  .route("/updateVender/:userId")
  .put(verifyJwt(["vendor", "admin"]), upload().none(), updateVenderProfile);
router
  .route("/updateVenderBio/:vendorID")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), updateVenderBio);
router
  .route("/updateVenderProfilePicture/:vendorID")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().single("profilePic"),
    updateVenderProfilePicture
  );
router
  .route("/getVenderProfile/:userId")
  .get(verifyJwt(["vendor", "admin"]), upload().none(), getOneVenderProfile);
router
  .route("/changeVenderPassword/:userId")
  .put(verifyJwt(["vendor", "admin"]), upload().none(), changeVenderPassword);
router
  .route("/deleteVenderProfile/:userId")
  .delete(verifyJwt(["vendor", "admin"]), upload().none(), deleteVenderAccount);
router
  .route("/logoutVender/:userId")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), logoutVender);
router
  .route("/updateVendorBankDetails")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    updateVenderBankDetails
  );
router
  .route("/uploadVendorDocuments")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload("documents", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]).single("document"),
    uploadVendorDocuments
  );
router
  .route("/updateVenderCalender/:vendorID")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), updateVenderCalender);
router
  .route("/updateVenderBusiness/:vendorID")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    uploadVenderBusinessDetails
  );
router
  .route("/addNewCategoryvenderBusinessDeatils/:businessId")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    addNewCategoryvenderBusinessDeatils
  );
router
  .route("/getVendorProfilePercentage/:vendorId")
  .get(
    // verifyJwt(["vendor", "admin"]),
    upload().none(),
    getVendorProfilePercentage
  );

export default router;
