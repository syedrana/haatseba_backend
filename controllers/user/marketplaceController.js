const Product = require("../../models/vendor/vendorproductModel");

const getmarketplaceProducts = async (req, res) => {
  try {
    const {
      q = "",          // search query
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
    } = req.query;

    const filter = {
      status: "active",
      isApproved: true,
    };

    // 🔍 Search by name
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    // 🏷️ Category filter
    if (category) {
      filter.category = category;
    }

    // 🏢 Brand filter
    if (brand) {
      filter.brand = brand;
    }

    // 💰 Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("brand", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getmarketplaceProducts };
