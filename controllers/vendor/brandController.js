// controllers/brandController.js
const Brand = require("../../models/vendor/brandModel");

// 🟢 Create Brand (Admin)
const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Brand.findOne({ name });
    if (exists)
      return res.status(400).json({ success: false, message: "Brand already exists" });

    const brand = await Brand.create({ name, description });
    res.status(201).json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Get All Active Brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ status: "active" }).sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBrand, getBrands };
