import Blog from "../modals/blog.modal.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const createBlog = async (req, res) => {
  try {
    const { title, authorName, content, category } = req.body;

    if (!title || !authorName || !content || !category) {
      return res
        .status(400)
        .json({
          error:
            "All required fields (title, authorName, content, category) must be provided.",
        });
    }

    const coverImage = req.file ? req.file.key : null;
    if (!coverImage) {
      return res.status(400).json({ error: "Cover image is required." });
    }

    const blog = new Blog({
      coverImage,
      title,
      authorName,
      content,
      category,
    });

    const savedBlog = await blog.save();

    return res
      .status(201)
      .json({ message: "Blog created successfully", blog: savedBlog });
  } catch (error) {
    if (req.file && req.file.key) {
      const params = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: req.file.key,
      };

      const deleteCommand = new DeleteObjectCommand(params);

      try {
        await s3Client.send(deleteCommand);
        console.log("Deleted uploaded image from S3 during error handling");
      } catch (err) {
        console.error("Failed to delete uploaded image from S3:", err);
      }
    }

    return res
      .status(500)
      .json({ error: "Failed to create blog", details: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Blog ID must be provided" });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.status(200).json(blog);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch blog", details: error.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    // Construct a search query
    const searchQuery = {
      $or: [
        { title: { $regex: search, $options: "i" } }, // Case-insensitive regex for title
        { authorName: { $regex: search, $options: "i" } }, // Case-insensitive regex for authorName
        { category: { $regex: search, $options: "i" } }, // Case-insensitive regex for category
      ],
    };

    // Fetch blogs with pagination and search
    const blogs = await Blog.find(searchQuery)
      .skip((page - 1) * limit) // Skip documents for previous pages
      .limit(Number(limit)) // Limit results to the specified count
      .sort({ createdAt: -1 }); // Sort by creation date (newest first)

    // Total count for pagination metadata
    const totalBlogs = await Blog.countDocuments(searchQuery);

    return res.status(200).json({
      blogs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBlogs / limit),
      totalBlogs,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch blogs", details: error.message });
  }
};

const updateBlog = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Blog ID must be provided" });
  }

  const { title, authorName, content, category, isPublished } = req.body;
  const coverImage = req.file ? req.file.key : null; 

  try {
    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const updatedData = {
      title,
      authorName,
      content,
      category,
      isPublished,
      coverImage: coverImage || existingBlog.coverImage,
    };

    const blog = await Blog.findByIdAndUpdate(id, updatedData, { new: true });

    if (coverImage && existingBlog.coverImage) {
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: existingBlog.coverImage,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log("Deleted old image from S3:", existingBlog.coverImage);
      } catch (err) {
        console.error("Failed to delete old image from S3:", err);
      }
    }

    return res
      .status(200)
      .json({ message: "Blog updated successfully", blog });
  } catch (error) {

    if (coverImage) {
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: coverImage,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log("Deleted new uploaded image from S3 due to error:", coverImage);
      } catch (err) {
        console.error("Failed to delete new uploaded image from S3:", err);
      }
    }

    return res
      .status(500)
      .json({ error: "Failed to update blog", details: error.message });
  }
};


const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Blog ID must be provided" });
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.coverImage) {
      const deleteParams = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: blog.coverImage,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log("Deleted image from S3:", blog.coverImage);
      } catch (err) {
        console.error("Failed to delete image from S3:", err);
      }
    }

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete blog", details: error.message });
  }
};
const getAllBlogsForUser = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchQuery = {
      isPublished: true,
      $or: [
        { title: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ],
    };

    const blogs = await Blog.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalBlogs = await Blog.countDocuments(searchQuery);

    return res.status(200).json({
      blogs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBlogs / limit),
      totalBlogs,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch blogs", details: error.message });
  }
};
const getOneBlogForUser = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOne({ _id: id, isPublished: true });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found or not published" });
    }

    return res.status(200).json(blog);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch the blog", details: error.message });
  }
};

export {
  deleteBlog,
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  getAllBlogsForUser,
  getOneBlogForUser,
};
