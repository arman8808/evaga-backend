import { Router } from "express";
import { getAllVendorWithThereProfileStatusAndService, vendorVerifyDocument } from "../controllers/adminAction.controller.js";
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
  .post(
    verifyJwt(["admin"]),
    upload().none(),
    vendorVerifyDocument
  );
export default router;
