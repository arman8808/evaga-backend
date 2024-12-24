import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  registerVendor,
  loginVendor,
  logoutVendor,
  changeVendorPassword,
  deleteVendorAccount,
  getOneVendorProfile,
  updateVendorProfile,
  updateVendorBankDetails,
  uploadVendorDocuments,
  updateVendorBio,
  updateVendorProfilePicture,
  updateVendorCalender,
  uploadVendorBusinessDetails,
  addNewCategoryvendorBusinessDeatils,
  getVendorProfilePercentage,
  getVendorProfileAllInOne,
  getBookingByMonth,
  editVendorCalender,
  setNewVendorPassword,
} from "../controllers/vendor.controller.js";
import { authController } from "../controllers/forgot.controller.js";
import { verifyController } from "../controllers/VendorVerifyController.js";

const router = Router();

router.route("/registerVender").post(upload().none(), registerVendor);
router.route("/loginVender").post(upload().none(), loginVendor);
router
  .route("/updateVender/:userId")
  .put(verifyJwt(["vendor", "admin"]), upload().none(), updateVendorProfile);
router
  .route("/updateVenderBio/:vendorID")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), updateVendorBio);
router
  .route("/updateVenderProfilePicture/:vendorID")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload("profilePic", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("profilePic"),
    updateVendorProfilePicture
  );
router
  .route("/getVenderProfile/:userId")
  .get(verifyJwt(["vendor", "admin"]), upload().none(), getOneVendorProfile);
router
  .route("/changeVenderPassword/:userId")
  .put(verifyJwt(["vendor", "admin"]), upload().none(), changeVendorPassword);
router
  .route("/deleteVenderProfile/:userId")
  .delete(verifyJwt(["vendor", "admin"]), upload().none(), deleteVendorAccount);
router
  .route("/logoutVender/:userId")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), logoutVendor);
router
  .route("/updateVendorBankDetails/:vendorID")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    updateVendorBankDetails
  );
router
  .route("/uploadVendorDocuments/:vendorID")
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
  .post(verifyJwt(["vendor", "admin"]), upload().none(), updateVendorCalender);
router
  .route("/updateVenderBusiness/:vendorID")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    uploadVendorBusinessDetails
  );
router
  .route("/addNewCategoryvenderBusinessDeatils/:businessId")
  .post(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    addNewCategoryvendorBusinessDeatils
  );
router
  .route("/getVendorProfilePercentage/:vendorId")
  .get(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    getVendorProfilePercentage
  );
router
  .route("/getVenderProfileAllInOne/:vendorId")
  .get(
    verifyJwt(["vendor", "admin"]),
    upload().none(),
    getVendorProfileAllInOne
  );
router
  .route("/getBookingByMonth/:vendorId")
  .get(verifyJwt(["vendor", "admin"]), upload().none(), getBookingByMonth);
router
  .route("/editVendorCalender/:bookingId")
  .post(verifyJwt(["vendor", "admin"]), upload().none(), editVendorCalender);
router.route("/forgot-password").post(upload().none(), authController);
router.route("/verify-One-time-password").post(upload().none(), verifyController );
router.route("/set-new-password/:userId").post(upload().none(), setNewVendorPassword );
export default router;
