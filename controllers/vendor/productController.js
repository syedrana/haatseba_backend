const Product = require("../../models/vendorproductModel");
const Vendor = require("../../models/vendorRequestModel");
const User = require("../../models/userModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");

// 🟢 Create Product
const createProduct = async (req, res) => {
  try {
    const userId = req.userid; // ✅ logged-in user (from authMiddleware)
    const { name, description, price, costPrice, discount, category, brand, stock } = req.body;

    // 🔒 1️⃣ User Validation
    const user = await User.findById(userId);
    const vendor = await Vendor.findOne({userId});
    console.log(user);
    console.log(vendor);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.isVendor) {
      return res.status(403).json({ success: false, message: "Only vendors can add products" });
    }
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor record not found",
      });
    }

    if (vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your vendor account is not approved yet",
      });
    }

    // 🧾 2️⃣ Input Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Product name must be at least 3 characters" });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters long" });
    }
    if (price == null || price < 0) {
      return res.status(400).json({ success: false, message: "Product price must be a positive number" });
    }
    if (costPrice == null || price < 0) {
      return res.status(400).json({ success: false, message: "Product cost price must be a positive number" });
    }
    if (discount < 0 || discount > 100) {
      return res.status(400).json({ success: false, message: "Discount must be between 0 and 100" });
    }
    if (stock == null || stock < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative" });
    }

    // ✅ Upload image
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Product image is required" });
    }

    const imageResult = await uploadToCloudinary(req.file.buffer);
    const imageUrl = imageResult.secure_url;
    const imagePublicId = imageResult.public_id;

    if (!imageResult || !imageUrl) {
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }

    // 🧩 3️⃣ Product Create
    const product = new Product({
      name: name,
      description: description,
      image: imageUrl,
      imagePublicId: imagePublicId,
      price: price,
      costPrice: costPrice,
      discount: discount,
      category: category || "General",
      brand: brand || "No Brand",
      stock: stock,
      vendorId: userId,
      isApproved: false, // ✅ admin approval required
      status: "inactive", // ✅ will be active after admin approval
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully (waiting for admin approval)",
      product,
    });
  } catch (err) {
    console.error("❌ Product creation error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating product",
      error: err.message,
    });
  }
};

// 🟢 Get All Products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active", isApproved: true })
      .populate("vendorId", "firstName lastName email");
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Get Product By ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "vendorId",
      "firstName lastName email"
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Update Product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // ভেন্ডর বা অ্যাডমিন অনুমতি
    if (req.user._id.toString() !== product.vendorId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    Object.assign(product, req.body); // request body থেকে update
    await product.save();

    res.json({ success: true, product, message: "Product updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Delete / Inactivate Product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (req.user._id.toString() !== product.vendorId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Soft delete
    product.status = "deleted";
    await product.save();

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Approve / Reject Product (Admin)
const approveProduct = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const { approve } = req.body; // true / false
    product.isApproved = approve;
    await product.save();

    res.json({ success: true, message: approve ? "Product approved" : "Product rejected", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = { createProduct };