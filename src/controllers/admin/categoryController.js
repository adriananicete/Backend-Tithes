import { Category } from "../../models/Category.js";

const getAllCategories = async (req, res) => {
  try {
    const getAllData = await Category.find();

    if (getAllData.length === 0)
      return res.status(404).json({ error: "Empty" });

    res.status(200).json(getAllData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, type, color } = req.body;
    const createdBy = req.user.id;

    if (!name || !type)
      return res.status(400).json({
        error: "Required All Fields!",
      });

    const newCategory = new Category({
      name,
      type,
      color,
      createdBy,
    });
    await newCategory.save();

    res.status(201).json({
      status: "Success",
      message: "Category created",
      data: {
        newCategory,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        type,
        color,
      },
      { new: true },
    );
    if (!updatedCategory)
      return res.status(404).json({ error: "Category not found" });

    res.status(200).json({
      status: "Success",
      message: "Category updated",
      data: {
        updatedCategory,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory)
      return res.status(404).json({ error: "Category not found" });

    res.status(200).json({
      status: "Success",
      message: "Category Deleted!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

export { getAllCategories, createCategory, updateCategory, deleteCategory };
