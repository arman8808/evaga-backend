import GstCategory from "../modals/gstCategory.modal.js";

const addGstCategory = async (req, res) => {
  try {
    const { categoryId, categoryName, gstPercentage } = req.body;
    const currentTime = new Date();

    const existingCategory = await GstCategory.findOne({ categoryId });
    if (existingCategory) {
      return res.status(400).json({ error: "Gst For This Category already exists" });
    }

    const newCategory = new GstCategory({
      categoryId,
      categoryName,
      gstRates: [{ gstPercentage, effectiveDate: currentTime }],
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGstRate = async (req, res) => {
  try {
    const { gstId } = req.params;
    const { gstPercentage } = req.body;
    const currentTime = new Date();

    const category = await GstCategory.findById(gstId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (category.gstRates.length > 0) {
      category.gstRates[category.gstRates.length - 1].endDate = currentTime;
    }

    category.gstRates.push({ gstPercentage, effectiveDate: currentTime });

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGstCategory = async (req, res) => {
  try {
    const { gstId } = req.params;
    const category = await GstCategory.findById(gstId);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteGstCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const deletedCategory = await GstCategory.findOneAndDelete({ categoryId });
    if (!deletedCategory)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllGstCategories = async (req, res) => {
  try {
    const categories = await GstCategory.find();

    if (categories.length === 0) {
      return res.status(200).json({ message: "No categories found" });
    }
    const activeCategories = categories.map((category) => {
      const latestRate = category.gstRates
        .filter((rate) => !rate.endDate)
        .sort(
          (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
        )[0];

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        gstPercentage: latestRate ? latestRate.gstPercentage : null,
        effectiveDate: latestRate ? latestRate.effectiveDate : null,
      };
    });

    res.status(200).json(activeCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  addGstCategory,
  updateGstRate,
  getGstCategory,
  deleteGstCategory,
  getAllGstCategories,
};
