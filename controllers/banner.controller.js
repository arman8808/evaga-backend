import { generateUniqueId } from "../utils/generateUniqueId.js";
import fs from "fs";
import path from "path";
import Banner from "../modals/Banner.modal.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createBanner = async (req, res) => {
  const { altText } = req.body;
  const bannerImage = req.file ? path.basename(req.file.path) : "";
  if (!bannerImage) {
    return res.status(400).json({ error: "banner Image is required" });
  }
  try {
    const newBanner = new Banner({
      BannerId: "Ban" + generateUniqueId(),
      BannerUrl: `banner/${bannerImage}`,
      altText,
    });

    await newBanner.save();
    res.status(201).json({ message: "Banner Saved Successfully" });
  } catch (error) {
    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "banner",
      bannerImage
    );
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete uploaded image:", err);
    });
    res.status(500).json({ message: "Error creating banner", error });
  }
};

// Get all banners
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({ message: "Data Fetch Successfully", banners });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};

// Get a single banner by ID
const getBannerById = async (req, res) => {
  const { bannerId } = req.params;
  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }

  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({ message: "Banner Saved Successfully", banner });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banner", error });
  }
};

// Update a banner by ID
const updateBannerById = async (req, res) => {
  const { bannerId } = req.params;
  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }
  const { altText, status } = req.body;
  const bannerImage = req.file ? path.basename(req.file.path) : null;

  try {
    const existingBanner = await Banner.findById(bannerId);
    if (!existingBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    const updatedData = {
      altText,
      status,
      ...(bannerImage && { BannerUrl: `/banner/${bannerImage}` }),
    };
    const banner = await Banner.findByIdAndUpdate(bannerId, updatedData, {
      new: true,
    });
    if (bannerImage) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        existingBanner.BannerUrl
      );
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Failed to delete old banner image:", err);
      });
    }
    res.status(200).json(banner);
  } catch (error) {
    if (bannerImage) {
      const newImagePath = path.join(
        __dirname,
        "..",
        "public",
        "banner",
        bannerImage
      );
      fs.unlink(newImagePath, (err) => {
        if (err) console.error("Failed to delete new uploaded image:", err);
      });
    }

    res.status(500).json({ message: "Error updating banner", error });
  }
};

// Delete a banner by ID
const deleteBannerById = async (req, res) => {
  const { bannerId } = req.params;
  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }
  try {
    // Retrieve the banner information
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    // Delete the banner from the database
    await Banner.findByIdAndDelete(bannerId);
    // Delete the image file from the file system
    const imagePath = path.join(__dirname, "..",  "public", banner.BannerUrl);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete banner image:", err);
    });
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error });
  }
};
export {
  createBanner,
  getBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
};