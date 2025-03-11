import Blog from "../modals/blog.modal.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const createBlog = async (req, res) => {
  try {
    const { title, authorName, content, category } = req.body;

    if (!title || !authorName || !content || !category) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const coverImage = req.file ? path.basename(req.file.path) : "";
    if (!coverImage) {
      return res.status(400).json({ error: "cover Image is required" });
    }
    const blog = new Blog({
      coverImage: `blog/${coverImage}`,
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
    const imagePath = path.join(__dirname, "..", "public", "blog", coverImage);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete uploaded image:", err);
    });

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
  const coverImage = req.file ? path.basename(req.file.path) : null;
  try {
    const existingBanner = await Blog.findById(id);
    if (!existingBanner) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const updatedData = {
      title,
      authorName,
      content,
      category,
      isPublished,
      ...(coverImage && { coverImage: `blog/${coverImage}` }),
    };
    const blog = await Blog.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (coverImage) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        existingBanner.coverImage
      );
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Failed to delete old banner image:", err);
      });
    }
    return res.status(200).json({ message: "Blog updated successfully" });
  } catch (error) {
    if (coverImage) {
      const newImagePath = path.join(
        __dirname,
        "..",
        "public",
        "blog",
        coverImage
      );
      fs.unlink(newImagePath, (err) => {
        if (err) console.error("Failed to delete new uploaded image:", err);
      });
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
    const imagePath = path.join(__dirname, "..", "public", blog.coverImage);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete Blog image:", err);
    });
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

export { deleteBlog, createBlog, getAllBlogs, getBlogById, updateBlog,getAllBlogsForUser,getOneBlogForUser };
