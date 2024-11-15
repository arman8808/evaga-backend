import Form from "../models/form.modal.js";
const createForm = async (req, res) => {
  const { Category, fields } = req.body;
  if (!Category || !fields || !Array.isArray(fields) || fields.length === 0) {
    return res
      .status(400)
      .json({ message: "Title and at least one field are required" });
  }
  try {
    const form = new Form({
      Category,
      createdBy: "672b05505b4f12fc6d6de290",
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
export { createForm, getOneForm, getAllForms, updateOneForm, deleteForm };
