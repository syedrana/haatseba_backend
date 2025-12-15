const Product = require("../../models/vendor/vendorproductModel");

const registerProduct = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .select("_id name price costPrice");

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {registerProduct};