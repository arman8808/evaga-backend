import express from "express";
import {
  addCategory,
  getCategories,
  addSubCategory,
  getSubCategoriesByCategory,
  getOneCategory,
  updateCategory,
  deleteCategory,
  editSubCategory,
  getOneSubCategory,
  deleteSubCategory,
} from "../controllers/categoryController.js";
import { upload, uploadToS3 } from "../middlewares/multer.middleware.js";

const router = express.Router();

router
  .route("/category")
  .post(
    uploadToS3("images", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("icon"),
    addCategory
  );
router.route("/categories").get(upload().none(), getCategories);
router.route("/addSubCategory").post(upload().none(), addSubCategory);
router.route("/getOneCategory/:catId").get(upload().none(), getOneCategory);
router.route("/deleteCategory/:catId").delete(upload().none(), deleteCategory);
router
  .route("/updateCategory/:catId")
  .put(
    uploadToS3("images", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("icon"),
    updateCategory
  );
router
  .route("/getSubCategoriesByCategory/:categoryId")
  .get(upload().none(), getSubCategoriesByCategory);

router
  .route("/getOneSubCategory/:subCategoryId")
  .get(upload().none(), getOneSubCategory);
router
  .route("/deleteSubCategory/:subCategoryId")
  .delete(upload().none(), deleteSubCategory);
router
  .route("/editSubCategory/:subCategoryId")
  .put(
    upload("images", [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ]).single("icon"),
    editSubCategory
  );
export default router;
