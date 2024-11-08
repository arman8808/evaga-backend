import Category from "../models/categoryModel.js";
import path from "path";
const addCategory = async (req, res) => {
  const { name } = req.body;
  const icon = req.file ? path.basename(req.file.path) : "";
  console.log(icon);
  
  try {
    const newCategory = new Category({ name, icon });
    await newCategory.save();
    res
      .status(201)
      .json({
        message: "Category created successfully",
        category: newCategory,
      });
  } catch (error) {
    console.log(error);
    
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
  const { categoryId } = req.params;
  const { name } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.subCategories.push({ name });
    await category.save();

    res
      .status(201)
      .json({ message: "Sub-Category added successfully", category });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export { addCategory, addSubCategory, getCategories };
