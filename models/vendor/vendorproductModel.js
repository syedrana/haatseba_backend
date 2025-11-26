// models/productModel.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // 🏷️ নাম
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },

    // 🔗 SEO-friendly slug
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },

    // 📄 বিবরণ
    description: {
      type: String,
      default: "",
      minlength: [10, "Description should be at least 10 characters"],
      maxlength: [5000, "Description is too long"],
    },

    // 🖼️ ইমেজ URL (Cloudinary secure_url)
    image: {
      type: String,
      required: [true, "Image is required"],     
      trim: true,
    },

    // 🗑️ Cloudinary public IDs (for deletion)
    imagePublicId: {
      type: String,
      default: null,
    },

    // 💰 দাম
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },

    // 💸 মূল ক্রয়মূল্য (Cost Price)
    costPrice: {
      type: Number,
      required: [true, "Product cost price is required"],
      min: [0, "Cost cannot be negative"],
      default: 0,
    },

    // 🎁 ডিসকাউন্ট %
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    // 🏷️ ক্যাটাগরি
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },


    // 🏢 ব্র্যান্ড রেফারেন্স
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },

    // 📦 স্টক
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    // 👤 বিক্রেতা (Seller/Vendor)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },

    // ✅ অ্যাডমিন অনুমোদন
    isApproved: {
      type: Boolean,
      default: false,
    },

    // 💰 লাভ / কমিশন ট্র্যাকিং
    profit: {
      vendorProfit: { type: Number, default: 0 }, // বিক্রয়ের পর ভেন্ডরের লাভ
      adminCommission: { type: Number, default: 0 }, // অ্যাডমিন কমিশন %
    },

    // 🌟 রেটিং
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be negative"],
        max: [5, "Rating cannot exceed 5"],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, "Rating count cannot be negative"],
      },
    },

    // 📌 স্ট্যাটাস (active / inactive / deleted)
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "inactive",
    },
  },
  { timestamps: true } // ✅ createdAt, updatedAt auto-manage
);

// 🔧 Pre-save hook (slug auto generate + updatedAt refresh)
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
