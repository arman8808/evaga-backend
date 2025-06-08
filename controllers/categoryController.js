// import {Category} from "../models/categoryModel.js";
// import path from "path";
// const addCategory = async (req, res) => {
//   const { name } = req.body;
//   const icon = req.file ? path.basename(req.file.path) : "";

//   try {
//     const newCategory = new Category({ name, icon });
//     await newCategory.save();
//     res
//       .status(201)
//       .json({
//         message: "Category created successfully",
//         category: newCategory,
//       });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

// const getCategories = async (req, res) => {
//   try {
//     const categories = await Category.find();
//     res.status(200).json(categories);
//   } catch (error) {
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

// const addSubCategory = async (req, res) => {
//   const { categoryId } = req.params;
//   const { name } = req.body;

//   try {
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     category.subCategories.push({ name });
//     await category.save();

//     res
//       .status(201)
//       .json({ message: "Sub-Category added successfully", category });
//   } catch (error) {
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

// export { addCategory, addSubCategory, getCategories };

import { Category, SubCategory } from "../modals/categoryModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const addCategory = async (req, res) => {
  const { name, status } = req.body;

  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError.message });
  }

  const icon = req.file ? req.file.key : "";
  if (!icon) {
    return res.status(400).json({ error: "Please provide an icon" });
  }

  try {
    const newCategory = new Category({
      name,
      icon,
      status,
    });

    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const getOneCategory = async (req, res) => {
  const { catId } = req.params;

  if (!catId) {
    return res.status(400).json({ error: "Category ID is required" });
  }

  try {
    const category = await Category.findById(catId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category Fetch Successfully", category });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const updateCategory = async (req, res) => {
  const { catId } = req.params;
  const { name, status } = req.body;
  const icon = req.file ? req.file.key : null;

  if (!catId) {
    return res.status(400).json({ error: "Category ID is required" });
  }

  try {
    const category = await Category.findById(catId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const oldIconKey = category.icon;
    category.name = name || category.name;
    category.status = status || category.status;
    category.icon = icon || category.icon;

    await category.save();

    if (icon && oldIconKey) {
      try {
        const params = {
          Bucket: process.env.PUBLIC_BUCKET_NAME,
          Key: oldIconKey,
        };
        await s3Client.send(new DeleteObjectCommand(params));
      } catch (s3Error) {
        console.error("Failed to delete old icon from S3:", s3Error.message);
      }
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    if (icon) {
      try {
        const params = {
          Bucket: process.env.PUBLIC_BUCKET_NAME,
          Key: icon,
        };
        await s3Client.send(new DeleteObjectCommand(params));
      } catch (s3Error) {
        console.error(
          "Failed to delete new icon from S3 after error:",
          s3Error.message
        );
      }
    }

    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { catId } = req.params;

  if (!catId) {
    return res.status(400).json({ error: "Category ID is required" });
  }

  try {
    await SubCategory.deleteMany({ categoryId: catId });

    const category = await Category.findById(catId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const iconKey = category.icon;

    await Category.findByIdAndDelete(catId);

    if (iconKey) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: iconKey,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`Deleted ${iconKey} from S3`);
      } catch (s3Error) {
        console.error("Failed to delete icon from S3:", s3Error.message);
      }
    }

    res.status(200).json({
      message: "Category and linked subcategories deleted successfully",
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const addSubCategory = async (req, res) => {
  const { categoryId } = req.body;
  const { name, status } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const newSubCategory = new SubCategory({ name, categoryId, status });
    await newSubCategory.save();

    res.status(201).json({
      message: "Sub-Category added successfully",
      subCategory: newSubCategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const getSubCategoriesByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const subCategories = await SubCategory.find({
      categoryId,
      status: { $ne: false },
    });

    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const editSubCategory = async (req, res) => {
  const { subCategoryId } = req.params; // SubCategory ID to be edited
  const { name, categoryId, status } = req.body; // New name or categoryId

  try {
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ error: "Sub-Category not found" });
    }

    // Update fields if provided
    if (name) subCategory.name = name;
    if (status) subCategory.status = name;
    if (categoryId) subCategory.categoryId = categoryId;

    await subCategory.save();

    res.status(200).json({
      message: "Sub-Category updated successfully",
      subCategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const getOneSubCategory = async (req, res) => {
  const { subCategoryId } = req.params;

  try {
    const subCategory = await SubCategory.findById(subCategoryId).populate(
      "categoryId"
    );
    if (!subCategory) {
      return res.status(404).json({ error: "Sub-Category not found" });
    }

    res.status(200).json({ subCategory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const deleteSubCategory = async (req, res) => {
  const { subCategoryId } = req.params;

  try {
    const subCategory = await SubCategory.findByIdAndDelete(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ error: "Sub-Category not found" });
    }

    res.status(200).json({ message: "Sub-Category deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export {
  addCategory,
  getCategories,
  addSubCategory,
  getSubCategoriesByCategory,
  getOneCategory,
  updateCategory,
  deleteCategory,
  editSubCategory,
  getOneSubCategory,
  deleteSubCategory,
};
