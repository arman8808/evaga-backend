import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getAllBlogsForUser,
  getBlogById,
  getOneBlogForUser,
  updateBlog,
} from "../controllers/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-blog",
  verifyJwt(["admin"]),
  upload("blog", ["image/png", "image/jpg", "image/jpeg", "image/webp"]).single(
    "coverImage"
  ),
  createBlog
);
router.get("/get-one-blog/:id", upload().none(), getBlogById);
router.get("/get-All-Blog", upload().none(), getAllBlogs);
router.post(
  "/update-one-blog/:id",
  verifyJwt(["admin"]),
  upload("blog", ["image/png", "image/jpg", "image/jpeg", "image/webp"]).single(
    "coverImage"
  ),
  updateBlog
);
router.delete(
  "/delete-one-blog/:id",
  verifyJwt(["admin"]),
  upload().none(),
  deleteBlog
);
router.get("/get-all-blog-for-user", upload().none(), getAllBlogsForUser);
router.get("/get-one-blog-for-user/:id", upload().none(), getOneBlogForUser);

export default router;
