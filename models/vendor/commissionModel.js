// models/commissionModel.js
const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    // 🏷️ কোন ক্যাটাগরির জন্য কমিশন সেট করা হয়েছে
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // 👤 কোন ভেন্ডরের জন্য (Optional)
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null মানে ক্যাটাগরি-লেভেল কমিশন
    },

    // 💰 কমিশন রেট (%)
    rate: {
      type: Number,
      required: true,
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },

    // 📜 ইতিহাস ট্র্যাকিংয়ের জন্য
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // সাধারণত Admin
      required: true,
    },

    // ℹ️ স্ট্যাটাস
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commission", commissionSchema);
