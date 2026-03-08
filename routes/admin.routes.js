import { Router } from "express";
import {
  changePasswordAdmin,
  deleteAdmin,
  getAllAdmin,
  getOneAdmin,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  updateAdmin,
  setNewAdminPassword,
} from "../controllers/admin.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { downloadVendorsAsCSV } from "../controllers/adminAction.controller.js";
import { authController } from "../controllers/forgot.controller.js";
import { verifyController } from "../controllers/VendorVerifyController.js";
const router = Router();
router.route("/registerAdmin").post(upload().none(), registerAdmin);
router.route("/loginAdmin").post(upload().none(), loginAdmin);
router
  .route("/updateAdmin/:userId")
  .put(verifyJwt(["admin", "sub_admin"]), upload().none(), updateAdmin);
router
  .route("/getOneAdmin/:userId")
  .get(verifyJwt(["admin", "sub_admin"]), upload().none(), getOneAdmin);
router
  .route("/changeAdminPassword/:userId")
  .put(verifyJwt(["admin", "sub_admin"]), upload().none(), changePasswordAdmin);
router
  .route("/deleteAdminProfile/:userId")
  .delete(verifyJwt(["admin"]), upload().none(), deleteAdmin);
router
  .route("/logoutAdmin/:userId")
  .post(verifyJwt(["admin", "sub_admin"]), upload().none(), logoutAdmin);
router
  .route("/getAllAdmin")
  .get(verifyJwt(["admin"]), upload().none(), getAllAdmin);

router.route("/forgot-password").post(upload().none(), authController);
router.route("/verify-One-time-password").post(upload().none(), verifyController);
router
  .route("/set-new-password/:userId")
  .post(upload().none(), setNewAdminPassword);

export default router;
