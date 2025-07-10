import verifyJwt from "../middlewares/auth.middleware.js";
import express from "express";
import {
  processImagePreview,
  uploadToS3WithEncoded,
} from "../middlewares/uploadWithEncode.middleware.js";
import { createGallery, deleteGallery, getAllGalleries } from "../controllers/gallery.controller.js";
const router = express.Router();

router.route("/add-gallery").post(
  //   verifyJwt(["admin"]),
  uploadToS3WithEncoded("gallery", [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
  ]),
  processImagePreview,
  createGallery
);
router.get("/", getAllGalleries);

// Delete a gallery
router.delete("/:id", deleteGallery);

export default router;
