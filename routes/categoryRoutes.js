import express from 'express';
import { addCategory, getCategories, addSubCategory } from '../controllers/categoryController.js';
import { upload } from '../middlewares/multer.middleware.js';
import verifyJwt from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route("/category").post(upload.single("icon"), addCategory);
router.route("/categories").get(upload.none(), getCategories);
router.route("/addSubCategory").post(upload.none(), addSubCategory);


export default router;
