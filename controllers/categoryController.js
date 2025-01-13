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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const addCategory = async (req, res) => {
  const { name } = req.body;
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError.message });
  }
  const icon = req.file ? path.basename(req.file.path) : "";
  if (!icon) {
    return res.status(404).json({ error: "Please Provide Icon" });
  }

  try {
    const newCategory = new Category({ name, icon: `images/${icon}` });
    await newCategory.save();
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.log(error);
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
  const { name } = req.body;
  const icon = req.file ? path.basename(req.file.path) : "";
  if (!catId) {
    return res.status(400).json({ error: "Category ID is required" });
  }
  try {
    const category = await Category.findById(catId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const oldImagePath = category.icon;
    category.name = name || category.name;
    category.icon = icon ? `images/${icon}` : category.icon;
    await category.save();
    if (icon && oldImagePath) {
      try {
        fs.unlinkSync(path.join(__dirname, "..", "public", oldImagePath));
      } catch (fsError) {
        console.error("Failed to delete old image:", fsError.message);
      }
    }
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    if (imageFile) {
      try {
        fs.unlinkSync(path.join(__dirname, "..", "public", icon.path));
      } catch (fsError) {
        console.error(
          "Failed to delete new image after error:",
          fsError.message
        );
      }
    }
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const addSubCategory = async (req, res) => {
  const { categoryId } = req.body;
  const { name } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const newSubCategory = new SubCategory({ name, categoryId });
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

export {
  addCategory,
  getCategories,
  addSubCategory,
  getSubCategoriesByCategory,
  getOneCategory,
  updateCategory,
};
