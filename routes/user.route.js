import { Router } from "express";
import {
  changePassword,
  deleteUserAccount,
  getOneUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
  updateUserProfilePicture,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/registerUser").post(upload().none(), registerUser);
router.route("/loginUser").post(upload().none(), loginUser);
router
  .route("/updateUser/:userId")
  .put(verifyJwt(["user", "admin"]), upload().none(), updateUserProfile);
router
  .route("/getUserProfile/:userId")
  .get(verifyJwt(["user", "admin"]), upload().none(), getOneUserProfile);
router
  .route("/changeUserPassword/:userId")
  .put(verifyJwt(["user", "admin"]), upload().none(), changePassword);
router
  .route("/deleteUserProfile/:userId")
  .delete(verifyJwt(["user", "admin"]), upload().none(), deleteUserAccount);
router
  .route("/logoutUser/:userId")
  .post(verifyJwt(["user", "admin"]), upload().none(), logoutUser);
router
  .route("/updateUserProfilePicture/:userId")
  .put(
    verifyJwt(["user", "admin"]),
    upload(["image/png", "image/jpg", "image/jpeg", "image/webp"]).single(
      "profilePic"
    ),
    updateUserProfilePicture
  );

export default router;
