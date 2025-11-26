// controllers/categoryController.js
const Category = require("../../models/vendor/categoryModel");

// 🟢 Create Category (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ name });
    if (exists)
      return res.status(400).json({ success: false, message: "Category already exists" });

    const category = await Category.create({ name, description });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Get All Active Categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createCategory, getCategories };
