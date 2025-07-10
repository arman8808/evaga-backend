import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    originalImage: {
      type: String,
      trim: true,
    },
    encodedImage: {
      type: String,
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Gallery = mongoose.model("Gallery", GallerySchema);
export default Gallery;
