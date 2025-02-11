import { Router } from "express";
import {
  changePassword,
  deleteUserAccount,
  getAllUser,
  getOneUserProfile,
  getUserInterestStatus,
  googleAuth,
  loginUser,
  logoutUser,
  registerUser,
  setNewUserPassword,
  updateUserProfile,
  updateUserProfilePicture,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { authController } from "../controllers/forgot.controller.js";
import { verifyController } from "../controllers/VendorVerifyController.js";
import { saveUserInterests } from "../controllers/userInterest.controller.js";
import {
  addAddress,
  deleteAddress,
  getAllAddresses,
  getOneAddresses,
  setSelectedAddress,
  updateAddress,
} from "../controllers/userAddress.controller.js";
const router = Router();

router.route("/registerUser").post(upload().none(), registerUser);
router.route("/loginUser").post(upload().none(), loginUser);
router.route("/auth/google").post(upload().none(), googleAuth);

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
router.route("/forgot-password").post(upload().none(), authController);
router
  .route("/verify-One-time-password")
  .post(upload().none(), verifyController);
router.route("/get-all-user").get(
  // verifyJwt(["admin"]),
  upload().none(),
  getAllUser
);
router
  .route("/save-user-interest")
  .post(verifyJwt(["user"]), upload().none(), saveUserInterests);
router
  .route("/get-user-interest-status")
  .get(verifyJwt(["user"]), upload().none(), getUserInterestStatus);
router
  .route("/set-user-new-password/:userId")
  .post(upload().none(), setNewUserPassword);

router
  .route("/add-new-address/:userId")
  .post(verifyJwt(["user"]), upload().none(), addAddress);
router
  .route("/get-user-all-address/:userId")
  .get(verifyJwt(["user"]), upload().none(), getAllAddresses);
router
  .route("/get-user-one-address/:addressId")
  .get(verifyJwt(["user"]), upload().none(), getOneAddresses);
router
  .route("/update-user-one-address/:addressId")
  .put(verifyJwt(["user"]), upload().none(), updateAddress);
router
  .route("/delete-user-one-address/:addressId")
  .delete(verifyJwt(["user"]), upload().none(), deleteAddress);
router
  .route("/select-one-address/:userId/:addressId")
  .post(verifyJwt(["user"]), upload().none(), setSelectedAddress);
export default router;
