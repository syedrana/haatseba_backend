// models/categoryModel.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // 📛 নাম
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },

    // 🔗 SEO-friendly slug (auto generated)
    slug: {
      type: String,
      unique: true,
      trim: true,
    },

    // 🧩 সাব-ক্যাটাগরি সাপোর্ট
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // 📝 বর্ণনা
    description: {
      type: String,
      trim: true,
    },

    // 💰 ক্যাটাগরি লেভেলের ডিফল্ট কমিশন (%)
    defaultCommissionRate: {
      type: Number,
      default: 5, // অর্থাৎ ৫% কমিশন থাকবে ডিফল্ট হিসেবে
      min: [0, "Commission cannot be negative"],
      max: [100, "Commission cannot exceed 100%"],
    },

    // 🔄 স্ট্যাটাস
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// 🧠 Slug Auto Generate
categorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);

