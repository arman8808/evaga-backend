import { Menu } from "../modals/menu.modal.js";

const createMenu = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      associatedEntity,
      entityModel,
      fields,
      createdBy,
    } = req.body;
    if (
      !category ||
      !createdBy ||
      !fields ||
      !fields.length
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }
    const menu = new Menu({
      category,
      subCategory,
      associatedEntity,
      entityModel,
      fields,
      createdBy,
    });

    const savedMenu = await menu.save();
    res
      .status(201)
      .json({ message: "Menu created successfully", menu: savedMenu });
  } catch (error) {
    console.error("Error creating menu:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find()
      .populate("associatedEntity")
      .populate("createdBy");
    res.status(200).json({ message: "Menus fetched successfully", menus });
  } catch (error) {
    console.error("Error fetching menus:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findById(id)
      .populate("associatedEntity")
      .populate("createdBy");

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.status(200).json({ message: "Menu fetched successfully", menu });
  } catch (error) {
    console.error("Error fetching menu:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedMenu = await Menu.findByIdAndUpdate(id, updates, { new: true })
      .populate("associatedEntity")
      .populate("createdBy");

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res
      .status(200)
      .json({ message: "Menu updated successfully", menu: updatedMenu });
  } catch (error) {
    console.error("Error updating menu:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMenu = await Menu.findByIdAndDelete(id);

    if (!deletedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res
      .status(200)
      .json({ message: "Menu deleted successfully", menu: deletedMenu });
  } catch (error) {
    console.error("Error deleting menu:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export { createMenu, getAllMenus, getMenuById, updateMenu, deleteMenu };
