import express from "express";
import { addToCart, getCart } from "../controllers/Cart.controller";
const router = express.Router();

router
  .route("/add-to-cart/:userId")
  .post(verifyJwt(["admin"]), upload().none(), addToCart);
router
  .route("/get-user-cart/:userId")
  .post(verifyJwt(["admin"]), upload().none(), getCart);

export default router;
