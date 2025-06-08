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
import { upload, uploadToS3 } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-blog",
  verifyJwt(["admin"]),
  uploadToS3("blog", [
 "image/png",  // PNG
  "image/jpg",  // JPG (alternative MIME type for JPEG)
  "image/jpeg", // JPEG
  "image/webp", // WebP
  "image/gif",  // GIF
  "image/tiff", // TIFF
  "image/bmp",  // BMP
  "image/heif", // HEIF (High-Efficiency Image Format)
  "image/heic", // HEIC (used in iPhones for high-efficiency image compression)
  "image/svg+xml" // SVG (vector images, supported widely)
  ]).single("coverImage"),
  createBlog
);
router.get("/get-one-blog/:id", upload().none(), getBlogById);
router.get("/get-All-Blog", upload().none(), getAllBlogs);
router.post(
  "/update-one-blog/:id",
  verifyJwt(["admin"]),
  uploadToS3("blog", [
    "image/png", // PNG
    "image/jpg", // JPG (alternative MIME type for JPEG)
    "image/jpeg", // JPEG
    "image/webp", // WebP
    "image/gif", // GIF
    "image/tiff", // TIFF
    "image/bmp", // BMP
    "image/heif", // HEIF (High-Efficiency Image Format)
    "image/heic", // HEIC (used in iPhones for high-efficiency image compression)
    "image/HEIC", // HEIC (used in iPhones for high-efficiency image compression)
    "image/svg+xml", // SVG (vector images, supported widely)
  ]).single("coverImage"),
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
