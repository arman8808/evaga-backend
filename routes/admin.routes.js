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
  .get(verifyJwt(["admin"]), upload().none(), getOneAdmin);
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

export default router;
