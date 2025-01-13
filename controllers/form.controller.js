import mongoose from "mongoose";
import Form from "../modals/form.modal.js";
import { Menu } from "../modals/menu.modal.js";
const createForm = async (req, res) => {
  const { Category, SubCategory, fields, createdBy } = req.body;

  if (
    !Category ||
    !fields ||
    !Array.isArray(fields) ||
    fields.length === 0 ||
    !createdBy
  ) {
    return res
      .status(400)
      .json({ message: "Category and at least one field are required" });
  }
  try {
    const form = new Form({
      Category,
      SubCategory,
      createdBy,
      fields,
    });
    await form.save();
    res.status(201).json({ message: "Form created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating form", error: error.message });
  }
};

const getOneForm = async (req, res) => {
  const { formId } = req.params;
  if (!formId) {
    return res.status(404).json({ error: "Form ID is required" });
  }
  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.status(200).json(form);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching form", error: error.message });
  }
};

const getOneFormWithCategoryAlongWithSubCategory = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  if (!categoryId) {
    return res.status(400).json({ error: "Category ID is required" });
  }

  try {
    const query = { Category: new mongoose.Types.ObjectId(categoryId) };

    if (subCategoryId) {
      query.SubCategory = new mongoose.Types.ObjectId(subCategoryId);
    }

    const form = await Form.findOne(query);
    const menu = await Menu.findOne(query);
    let InHouseCategoringMasterMenu = [];
    let InHouseCategoringPackage= [];
    if (menu?.entityModel === "Venue") {
      InHouseCategoringMasterMenu = await Menu.findOne({
        entityModel: "IN-House-Catering",
      });
    }
    if (form?.title === "Event Venues Form") {
      const category = await Form.findOne({
        title: "Full Catering Service Form",
      });
      InHouseCategoringPackage=category
    }

    if (!form && !menu) {
      return res.status(404).json({
        message:
          "No form has been found that matches the selected category and subcategory.",
      });
    }

    res.status(200).json({
      message: "Form fetched successfully",
      Form: form || [],
      Menu: menu || [],
      InHouseCategoringMasterMenu: InHouseCategoringMasterMenu || [],
      InHouseCategoringPackage: InHouseCategoringPackage || [],
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
};

const getAllForms = async (req, res) => {
  try {
    const forms = await Form.find();
    res.status(200).json(forms);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching forms", error: error.message });
  }
};

const updateOneForm = async (req, res) => {
  const { formId } = req.params;
  const { Category, fields } = req.body;

  if (!formId) {
    return res.status(404).json({ error: "Form ID is required" });
  }
  if (!Category && (!fields || !Array.isArray(fields))) {
    return res.status(400).json({ message: "Provide fields to update" });
  }

  try {
    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      { Category, fields },
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.status(200).json({
      message: "Form updated successfully",
      form: updatedForm,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating form", error: error.message });
  }
};

const deleteForm = async (req, res) => {
  const { formId } = req.params;
  if (!formId) {
    return res.status(404).json({ error: "Form Id Is required" });
  }
  try {
    const deleteFormData = new Form.findByIdAndDelete(formId);
    if (!deleteFormData) {
      return res.status(404).json({ error: "No Form Id Found" });
    }
    res.status(200).json({ message: "Form Deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating form", error: error.message });
  }
};
export {
  createForm,
  getOneForm,
  getAllForms,
  updateOneForm,
  deleteForm,
  getOneFormWithCategoryAlongWithSubCategory,
};
