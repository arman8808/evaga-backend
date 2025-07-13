import mongoose from "mongoose";
import Gallery from "../modals/gallery.model.js";

const createGallery = async (req, res) => {
  const galleryPreview = req.file?.preview || null;

  const galleryImage = req.file ? req.file.location : "";
  if (!galleryImage) {
    return res.status(400).json({ error: "Gallery Image is required" });
  }

  try {
    const newGalleryData = {
      originalImage: galleryImage,
      encodedImage: galleryPreview,
      typeGallery: true,
    };

    const newGallery = new Gallery(newGalleryData);
    await newGallery.save();

    res
      .status(201)
      .json({ status: 201, message: "Gallery Saved Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating Gallery", error });
  }
};
const getAllGalleries = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional filtering by category
    const categoryFilter = req.query.category
      ? { category: req.query.category }
      : {};
    const filter = {
      ...categoryFilter,
      typeGallery: true,
    };
    // Get galleries with pagination
    const galleries = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const total = await Gallery.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: galleries,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching galleries", error });
  }
};

const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid gallery ID" });
    }

    const deletedGallery = await Gallery.findByIdAndDelete(id);

    if (!deletedGallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }

    res.status(200).json({ message: "Gallery deleted successfully" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Error deleting gallery", error });
  }
};

const getAllGalleriesWithoutPagination = async (req, res) => {
  try {
    const categoryFilter = req.query.category
      ? { category: req.query.category }
      : {};

    const filter = {
      ...categoryFilter,
      typeGallery: true,
    };

    const galleries = await Gallery.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      data: galleries,
      count: galleries.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching galleries", error });
  }
};

export {
  createGallery,
  getAllGalleries,
  deleteGallery,
  getAllGalleriesWithoutPagination,
};
