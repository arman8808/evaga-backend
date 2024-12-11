import { Router } from "express";
import { getAllVendorWithThereProfileStatusAndService } from "../controllers/adminAction.controller.js";
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
export default router;
