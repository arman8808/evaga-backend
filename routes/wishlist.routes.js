import { Router } from "express";
import {

  getWishlist,

  toggleWishlist,
} from "../controllers/wishlist.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/toggle-wishlist/:userId").post(
  // verifyJwt(["user","admin"]),
  upload().none(),
  toggleWishlist
);


router.route("/get-wishlist/:userId").get(
  // verifyJwt(["user","admin"]),
  upload().none(),
  getWishlist
);
export default router;
