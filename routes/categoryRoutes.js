import express from "express";
import {
  addCategory,
  getCategories,
  addSubCategory,
  getSubCategoriesByCategory,
} from "../controllers/categoryController.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = express.Router();

router
  .route("/category")
  .post(
    upload("images", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("icon"),
    addCategory
  );
router.route("/categories").get(upload().none(), getCategories);
router.route("/addSubCategory").post(upload().none(), addSubCategory);
router
  .route("/getSubCategoriesByCategory/:categoryId")
  .get(upload().none(), getSubCategoriesByCategory);
export default router;
