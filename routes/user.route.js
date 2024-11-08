import { Router } from "express";
import {
    changePassword,
    deleteUserAccount,
    getOneUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/registerUser").post(upload.none(), registerUser);
router.route("/loginUser").post(upload.none(), loginUser);
router.route("/updateUser/:userId").put(verifyJwt,upload.none(), updateUserProfile);
router.route("/getUserProfile/:userId").get(verifyJwt,upload.none(), getOneUserProfile);
router.route("/changeUserPassword/:userId").put(verifyJwt,upload.none(), changePassword);
router.route("/deleteUserProfile/:userId").delete(verifyJwt,upload.none(), deleteUserAccount);
router.route("/logoutUser/:userId").post(verifyJwt,upload.none(), logoutUser);

export default router;
