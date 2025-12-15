const Package = require("../../models/agent/packageModel");
const Product = require("../../models/vendor/vendorproductModel");

const createPackage = async (req, res) => {
  try {
    const { name, products, price } = req.body;
    const adminId = req.userid;

    if (!name || !products || !Array.isArray(products) || !price) {
      return res.status(400).json({
        message: "name, products array and price are required",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    //let totalUnits = 0;

    for (let item of products) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: "Each product must contain productId and valid quantity",
        });
      }

      if (!item.joining_quantity || item.joining_quantity <= 0) {
        return res.status(400).json({
          message: "Each product must contain joining_quantity > 0",
        });
      }

      const exist = await Product.findById(item.productId);
      if (!exist) {
        return res.status(400).json({
          message: `Product not found: ${item.productId}`,
        });
      }
    }

    const pkg = await Package.create({
      name,
      products,
      price: Number(price),
      createdBy: adminId,
    });

    return res.status(201).json({
      message: "Package created successfully",
      package: pkg,
    });

  } catch (error) {
    console.log("Create Package Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const searchProduct = async (req, res) => {
  const { query } = req.query;
  try {
    const products = await Product.find({ name: { $regex: query, $options: "i" } }).limit(20).sort({ name: 1 });
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllPackages = async (req, res) => {
  try {
    // optional: pagination query ?page=&limit=
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 100);
    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      Package.find({})
        .populate("products.productId", "name price image stock")
        .populate("createdBy", "firstName lastName email")
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Package.countDocuments(),
    ]);

    res.json({ packages, total, page, limit });
  } catch (err) {
    console.error("getAllPackages err:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET PACKAGE BY ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findById(id)
      .populate("products.productId", "name price image stock")
      .populate("createdBy", "firstName lastName email");

    if (!pkg) return res.status(404).json({ message: "Package not found" });

    res.json({ package: pkg });

  } catch (err) {
    console.error("getPackageById err:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// UPDATE PACKAGE (fixed)
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, products, price } = req.body;
    const adminId = req.userid;

    if (!name || !Array.isArray(products) || products.length === 0 || !price) {
      return res.status(400).json({ message: "Name, products and price are required" });
    }

    for (const p of products) {
      if (!p.productId || !p.quantity || Number(p.quantity) <= 0) {
        return res.status(400).json({ message: "Product must have valid productId and quantity" });
      }
      if (!p.joining_quantity || p.joining_quantity <= 0) {
        return res.status(400).json({ message: "Product must have joining_quantity > 0" });
      }

      const exists = await Product.findById(p.productId);
      if (!exists) return res.status(400).json({ message: `Invalid productId ${p.productId}` });
    }

    // Schema hook automatically calculates joining_stock & totalUnits
    const pkg = await Package.findById(id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    pkg.name = name;
    pkg.products = products;
    pkg.price = Number(price);
    pkg.updatedBy = adminId;

    await pkg.save(); // <-- important: to trigger pre-save hooks

    res.json({ message: "Package updated", package: pkg });

  } catch (err) {
    console.error("updatePackage err:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// DELETE PACKAGE
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Package.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Package not found" });

    res.json({ message: "Package deleted" });

  } catch (err) {
    console.error("deletePackage err:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ✅ Agent Packages Load API
const loadAgentPackages = async (req, res) => {
  try {
    const packages = await Package.find({ status: "active" })
      .populate("products.productId", "name price image stock")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createPackage, searchProduct, loadAgentPackages, getAllPackages, getPackageById, updatePackage, deletePackage, };
