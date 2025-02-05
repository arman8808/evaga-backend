import express from "express";
import {
  createCoupon,
  deleteCoupon,
  editCoupon,
  getCouponById,
  getCoupons,
  validateCoupon,
} from "../controllers/coupons.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route("/get-all-coupons").get(upload().none(), getCoupons);
router.route("/create-one-coupons").post(verifyJwt(["admin"]),upload().none(), createCoupon);
router.route("/validateCoupon-coupons").post(upload().none(), validateCoupon);
router.route("/get-one-coupons/:id").get(upload().none(), getCouponById);
router.route("/edit-one-coupons/:id").put(verifyJwt(["admin"]),upload().none(), editCoupon);
router.route("/delete-one-coupons/:id").delete(verifyJwt(["admin"]),upload().none(), deleteCoupon);

export default router;
