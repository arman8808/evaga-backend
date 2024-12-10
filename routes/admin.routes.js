import { Router } from "express";
import {
  changePasswordAdmin,
  deleteAdmin,
  getOneAdmin,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  updateAdmin,
} from "../controllers/admin.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router.route("/registerAdmin").post(upload().none(), registerAdmin);
router.route("/loginAdmin").post(upload().none(), loginAdmin);
router
  .route("/updateAdmin/:userId")
  .put(verifyJwt(["admin", "sub_admin"]), upload().none(), updateAdmin);
router
  .route("/getOneAdmin/:userId")
  .get(verifyJwt, upload().none(), getOneAdmin);
router
  .route("/changeAdminPassword/:userId")
  .put(verifyJwt, upload().none(), changePasswordAdmin);
router
  .route("/deleteAdminProfile/:userId")
  .delete(verifyJwt, upload().none(), deleteAdmin);
router
  .route("/logoutAdmin/:userId")
  .post(verifyJwt, upload().none(), logoutAdmin);

export default router;
