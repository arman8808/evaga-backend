import { Router } from "express";
import {
  archiveVendorServicehandle,
  deleteVendorService,
  getAdminDashboardDataHandle,
  getAllUsersWithOrderDetails,
  getAllVendorsPackage,
  getAllVendorWithNumberOfService,
  getAllVendorWithThereProfileStatusAndService,
  getVendorByNameOrVendorUserName,
  getVendorPackageList,
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
  .post(verifyJwt(["admin"]), upload().none(), getVendorByNameOrVendorUserName);
router.route("/getVendorPackageList/:vendorId/:categoryId").get(
  verifyJwt(["admin"]),

  upload().none(),
  getVendorPackageList
);
router
  .route("/getAllVendorsPackage")
  .get(verifyJwt(["admin"]), upload().none(), getAllVendorsPackage);
router
  .route("/archiveVendorServicehandle/:serviceId/:PackageId")
  .delete(verifyJwt(["admin"]), upload().none(), archiveVendorServicehandle);
router
  .route("/deleteVendorService/:serviceId/:PackageId")
  .delete(verifyJwt(["admin"]), upload().none(), deleteVendorService);
router
  .route("/getAllVendorWithNumberOfService")
  .get(verifyJwt(["admin"]), upload().none(), getAllVendorWithNumberOfService);
router
  .route("/getAllUsersWithOrderDetails")
  .get(verifyJwt(["admin"]), upload().none(), getAllUsersWithOrderDetails);
router
  .route("/getAdminDashboardDataHandle")
  .get(verifyJwt(["admin"]), upload().none(), getAdminDashboardDataHandle);
export default router;
