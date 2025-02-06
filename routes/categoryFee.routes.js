import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createCategoryFee,
  deleteCategoryFee,
  getCategoryFee,
  getCategoryFees,
  updateCategoryFee,
} from "../controllers/categoryFee.Controller.js";
const router = express.Router();
router
  .route("/createCategoryFee")
  .post(verifyJwt(["admin"]), upload().none(), createCategoryFee);
router.route("/getCategoryFees").get(upload().none(), getCategoryFees);
router.route("/getCategoryFee/:id").get(upload().none(), getCategoryFee);
router
  .route("/updateCategoryFee/:id")
  .put(verifyJwt(["admin"]), upload().none(), updateCategoryFee);
router
  .route("/deleteCategoryFee/:id")
  .delete(verifyJwt(["admin"]), upload().none(), deleteCategoryFee);
export default router;
