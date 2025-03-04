import express from "express";
import {
  addToCart,
  getCart,
  removeCartItem,
} from "../controllers/Cart.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { suggestSimilarServices } from "../controllers/suggestSimilarServices .js";
const router = express.Router();

router
  .route("/add-to-cart/:userId")
  .post(verifyJwt(["user", "admin"]), upload().none(), addToCart);
router
  .route("/get-user-cart/:userId")
  .get(verifyJwt(["user", "admin"]), upload().none(), getCart);
router
  .route("/remove-item-from-user-cart/:userId/:packageId")
  .post(verifyJwt(["user", "admin"]), upload().none(), removeCartItem);
router
  .route("/suggestSimilarServices")
  .post(verifyJwt(["user", "admin"]), upload().none(), suggestSimilarServices);

export default router;
