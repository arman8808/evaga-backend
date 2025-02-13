import { Router } from "express";
import {
  getAllVendorWithThereProfileStatusAndService,
  getVendorByNameOrVendorUserName,
  updateVendorBankDetailsByAdmin,
  updateVendorBioByAdmin,
  updateVendorProfileByAdmin,
  updateVendorProfilePictureByAdmin,
  uploadVendorBusinessDetailsByAdmin,
  vendorVerifyDocument,
} from "../controllers/adminAction.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router
  .route("/get-all-vendor-with-profile-status-and-no-of-service")
  .get(
    verifyJwt(["admin"]),
    upload().none(),
    getAllVendorWithThereProfileStatusAndService
  );
router
  .route("/verify-vendor-document/:documentId")
  .post(verifyJwt(["admin"]), upload().none(), vendorVerifyDocument);
router
  .route("/update-vendor-bank-details/:vendorID")
  .post(verifyJwt(["admin"]), upload().none(), updateVendorBankDetailsByAdmin);
router
  .route("/update-vendor-business-details/:vendorID")
  .post(
    verifyJwt(["admin"]),
    upload().none(),
    uploadVendorBusinessDetailsByAdmin
  );
router
  .route("/update-vendor-profile-details/:vendorID")
  .post(verifyJwt(["admin"]), upload().none(), updateVendorProfileByAdmin);
router
  .route("/update-vendor-bio-details/:vendorID")
  .post(verifyJwt(["admin"]), upload().none(), updateVendorBioByAdmin);
router
  .route("/update-vendor-profilepic-details/:vendorID")
  .post(
    verifyJwt(["admin"]),
    upload("profilePic", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("profilePic"),
    updateVendorProfilePictureByAdmin
  );
router
  .route("/get-search-vendors")
  .post(
    verifyJwt(["admin"]),
    upload().none(),
    getVendorByNameOrVendorUserName
  );
export default router;
