import { generateUniqueId } from "../utils/generateUniqueId.js";
import fs from "fs";
import path from "path";
import Banner from "../modals/banner.modal.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createBanner = async (req, res) => {
  const { altText, categoryId, forType, status } = req.body;

  const bannerImage = req.file ? req.file.key : "";
  if (!bannerImage) {
    return res.status(400).json({ error: "Banner Image is required" });
  }

  try {
    const newBannerData = {
      BannerId: "Ban" + generateUniqueId(),
      BannerUrl: bannerImage,
      altText,
      status,
    };
    if (forType) {
      newBannerData.forType = forType;
    }
    if (categoryId) {
      newBannerData.categoryId = categoryId;
    }

    const newBanner = new Banner(newBannerData);
    await newBanner.save();

    res.status(201).json({ message: "Banner Saved Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating banner", error });
  }
};

const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .select("-updatedAt -createdAt -altText -categoryId")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Data Fetch Successfully", banners });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};
const getUserBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ forType: "user", status: true });
    res.status(200).json({ message: "Data Fetch Successfully", banners });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};
const getVendorBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ forType: "vendor", status: true });
    res.status(200).json({ message: "Data Fetch Successfully", banners });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};

const getBannerById = async (req, res) => {
  const { bannerId } = req.params;
  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }

  try {
    const banner = await Banner.findById(bannerId).select(
      "-BannerId -createdAt -updatedAt"
    );
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({ message: "Banner Fetched Successfully", banner });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banner", error });
  }
};

const updateBannerById = async (req, res) => {
  const { bannerId } = req.params;

  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }

  const { altText, status } = req.body;
  const bannerImage = req.file ? req.file.key : null; // Use the key from S3 upload

  try {
    const existingBanner = await Banner.findById(bannerId);
    if (!existingBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Use the existing image if no new file is uploaded
    const updatedData = {
      altText,
      status,
      BannerUrl: bannerImage || existingBanner.BannerUrl,
    };

    const banner = await Banner.findByIdAndUpdate(bannerId, updatedData, {
      new: true,
    });

    if (
      bannerImage &&
      existingBanner.BannerUrl &&
      bannerImage !== existingBanner.BannerUrl
    ) {
      const oldKey = existingBanner.BannerUrl;

      // Delete the old file from S3
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: oldKey,
      };

      const deleteCommand = new DeleteObjectCommand(deleteParams);

      try {
        const deleteResponse = await s3Client.send(deleteCommand);
      } catch (err) {
        console.error("Error deleting old banner image:", err);
      }
    }

    res.status(200).json(banner);
  } catch (error) {
    if (bannerImage) {
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: bannerImage,
      };

      const deleteCommand = new DeleteObjectCommand(deleteParams);

      try {
        const deleteResponse = await s3Client.send(deleteCommand);
        console.log(
          "Deleted new banner image during rollback:",
          deleteResponse
        );
      } catch (err) {
        console.error("Error deleting new banner image during rollback:", err);
      }
    }

    res.status(500).json({ message: "Error updating banner", error });
  }
};

const deleteBannerById = async (req, res) => {
  const { bannerId } = req.params;

  if (!bannerId) {
    return res.status(400).json({ errors: "bannerId is required" });
  }

  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await Banner.findByIdAndDelete(bannerId);

    if (banner.BannerUrl) {
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: banner.BannerUrl,
      };

      const deleteCommand = new DeleteObjectCommand(deleteParams);

      try {
        const deleteResponse = await s3Client.send(deleteCommand);
        console.log("Deleted banner image from S3:", deleteResponse);
      } catch (err) {
        console.error("Error deleting banner image from S3:", err);
      }
    }

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
  getUserBanners,
  getVendorBanners,
};
