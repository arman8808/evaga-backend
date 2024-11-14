import Form from "../models/form.modal.js";
const createForm = async (req, res) => {
  const {
    title,
    fields,
  } = req.body;
  if (!title || !fields || !Array.isArray(fields) || fields.length === 0) {
    return res
      .status(400)
      .json({ message: "Title and at least one field are required" });
  }


  try {
    const form = new Form({
      title,
      createdBy: '672b05505b4f12fc6d6de290',
      fields,
    });

    await form.save();

    res.status(201).json({ message: "Form created successfully", form });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating form", error: error.message });
  }
};
export { createForm };
