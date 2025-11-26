const mongoose = require("mongoose");

const vendorRequestSchema = new mongoose.Schema(
  {
    // 🧍‍♂️ কোন ইউজার আবেদন করছে
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User ID is required"], 
      index: true 
    },

    // 🏪 ব্যবসার নাম
    businessName: { 
      type: String, 
      required: [true, "Business name is required"], 
      trim: true, 
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [100, "Business name cannot exceed 100 characters"]
    },

    // 📍 ব্যবসার ঠিকানা
    businessAddress: { 
      type: String, 
      required: [true, "Business address is required"], 
      trim: true, 
      minlength: [5, "Address must be at least 5 characters"]
    },

    // 🧾 ট্রেড লাইসেন্স নম্বর
    tradeLicenseNumber: { 
      type: String, 
      default: "", 
      trim: true, 
      match: [/^[A-Za-z0-9-]*$/, "Trade license number is invalid"]
    },

    // 📞 ব্যবসার ফোন নম্বর
    businessPhone: { 
      type: String, 
      required: [true, "Business phone is required"],
      trim: true,
      match: [/^01[0-9]{9}$/, "Invalid Bangladeshi phone number"]
    },

    // 📧 ব্যবসার ইমেইল (optional)
    businessEmail: { 
      type: String, 
      trim: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    // 🏦 পেমেন্ট ইনফো (যদি কমিশন বা পেমেন্ট পাঠাতে হয়)
    bankAccount: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      bkashNumber: { type: String, trim: true, match: [/^01[0-9]{9}$/] },
      nagadNumber: { type: String, trim: true, match: [/^01[0-9]{9}$/] },
    },

    // 📁 প্রয়োজনীয় ডকুমেন্ট (cloudinary urls)
    documents: [{ type: String }],

    // 🧾 আবেদন এর স্ট্যাটাস
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },

    // 🗓️ অ্যাডমিন কখন অ্যাকশন নিয়েছে
    reviewedAt: { 
      type: Date,
      default: null, // ✅ তারিখের জন্য null সঠিক (ফাঁকা স্ট্রিং নয়)
    },

    // 👤 কোন অ্যাডমিন রিভিউ করেছে
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", // ✅ যদি তোমার অ্যাডমিন মডেলের নাম "Admin" হয়
      default: null,
    },

    // 💬 অ্যাডমিন মন্তব্য (যদি reject করে)
    adminNote: { 
      type: String, 
      trim: true,
      default: "", // ✅ string হলে ফাঁকা স্ট্রিং ঠিক আছে
    },

  },
  { timestamps: true } // createdAt, updatedAt স্বয়ংক্রিয়ভাবে যোগ হবে
);

module.exports = mongoose.model("VendorRequest", vendorRequestSchema);
