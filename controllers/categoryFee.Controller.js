import CategoryFee from "../modals/categoryFee.modal.js";

const createCategoryFee = async (req, res) => {
  try {
    const { categoryId, feesPercentage, description, status } = req.body;
    const existingCategoryFee = await CategoryFee.findOne({ categoryId });
    if (existingCategoryFee) {
      return res
        .status(400)
        .json({ error: "Category Fee for this category already exists" });
    }

    const categoryFee = new CategoryFee({
      categoryId,
      feesPercentage,
      description,
      status,
    });

    const savedCategoryFee = await categoryFee.save();
    res.status(201).json(savedCategoryFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCategoryFees = async (req, res) => {
  try {
    const categoryFees = await CategoryFee.find()
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Data Fetch Successfully", categoryFees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategoryFee = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryFee = await CategoryFee.findById(id)

    if (!categoryFee) {
      return res.status(404).json({ error: "Category Fee not found" });
    }

    res.status(200).json(categoryFee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategoryFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedCategoryFee = await CategoryFee.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    if (!updatedCategoryFee) {
      return res.status(404).json({ error: "Category Fee not found" });
    }

    res.status(200).json(updatedCategoryFee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteCategoryFee = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategoryFee = await CategoryFee.findByIdAndDelete(id);
    if (!deletedCategoryFee) {
      return res.status(404).json({ error: "Category Fee not found" });
    }

    res.status(200).json({ message: "Category Fee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export {
  createCategoryFee,
  getCategoryFees,
  getCategoryFee,
  updateCategoryFee,
  deleteCategoryFee,
};
