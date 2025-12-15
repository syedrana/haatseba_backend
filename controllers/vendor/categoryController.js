const Category = require("../../models/vendor/categoryModel");

// 🟢 Create Category / Sub-Category (Admin)
const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parentCategory = null,
      defaultCommissionRate,
      status = "active",
    } = req.body;

    // 🔒 Duplicate Check (same name under same parent)
    const exists = await Category.findOne({
      name: new RegExp(`^${name}$`, "i"),
      parentCategory,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists under this parent",
      });
    }

    // 🧠 Parent Validation
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const category = await Category.create({
      name,
      description,
      parentCategory,
      defaultCommissionRate,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 🟢 Get Categories (Tree Friendly)
const getCategories = async (req, res) => {
  try {
    const q = req.query.q || "";
    const categories = await Category.find({name: { $regex: q, $options: "i" }, status: "active" })
      .limit(20)
      .select("name")
      .populate("parentCategory", "name")
      .sort({ name: 1 });

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
};
