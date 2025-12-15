const Product = require("../../models/vendor/vendorproductModel");
const Vendor = require("../../models/vendor/vendorRequestModel");
const User = require("../../models/userModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
const cloudinary = require("../../config/cloudinary");

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
    if (costPrice == null || costPrice < 0) {
      return res.status(400).json({ success: false, message: "Product cost price must be a positive number" });
    }
    if (costPrice > price) {
      return res.status(400).json({ message: "Cost price cannot exceed selling price" });
    }
    if (discount < 0 || discount > 100) {
      return res.status(400).json({ success: false, message: "Discount must be between 0 and 100" });
    }
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    } 
    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
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

// GET /vendor/products
const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({
      vendorId: req.userid,
      status: { $ne: "deleted" },
    })
      .populate("category", "name")
      .populate("brand", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🟢 Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // ভেন্ডর বা অ্যাডমিন অনুমতি
    if (req.userid.toString() !== product.vendorId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Multipart/FormData থেকে data handle
    if (req.body.name) product.name = req.body.name;
    if (req.body.price) product.price = Number(req.body.price);
    if (req.body.stock) product.stock = Number(req.body.stock);
    if (req.body.discount) product.discount = Number(req.body.discount);
    if (req.body.description) product.description = req.body.description;

    // যদি image আপলোড হয়
    if (req.file) {

      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      // Cloudinary বা যেখান থেকে image handle করো
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
      product.imagePublicId = result.public_id;
    }

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
    const product = await Product.findById(req.params.id); // ✅ fix
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // ভেন্ডর বা অ্যাডমিন অনুমতি
    if (req.userid.toString() !== product.vendorId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // 🔥 Permanent delete
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Product deleted permanently" });
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


module.exports = { 
  createProduct, 
  getVendorProducts, 
  updateProduct, 
  deleteProduct 
};