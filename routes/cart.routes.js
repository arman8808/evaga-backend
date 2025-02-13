import express from "express";
import { addToCart, getCart } from "../controllers/Cart.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = express.Router();

router
  .route("/add-to-cart/:userId")
  .post(verifyJwt(["user", "admin"]), upload().none(), addToCart);
router
  .route("/get-user-cart/:userId")
  .get(verifyJwt(["user","admin"]), upload().none(), getCart);

export default router;
