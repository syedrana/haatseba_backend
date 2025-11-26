const VendorRequest = require("../../models/vendor/vendorRequestModel");
const User = require("../../models/userModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");

// 🛡️ Helper: sanitize & trim string safely
const clean = (value) => (typeof value === "string" ? value.trim() : "");

// ✅ ভেন্ডর রিকোয়েস্ট সাবমিট (User side)
const createVendorRequest = async (req, res) => {
  try {
    const userId = req.userid; // 🧩 JWT middleware থেকে
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed. Token missing or invalid.",
      });
    }

    const {
      businessName,
      businessAddress,
      tradeLicenseNumber,
      businessPhone,
      businessEmail,
    } = req.body;

    // 🔍 প্রাথমিক ভেলিডেশন
    if (!businessName?.trim() || !businessAddress?.trim() || !businessPhone?.trim()) {
      return res.status(400).json({
        message: "Business name, address, and phone number are required.",
      });
    }

    // 🔍 ইউজার এক্সিস্ট কিনা চেক
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 🔍 আগের রিকোয়েস্ট আছে কিনা
    const existingRequest = await VendorRequest.findOne({ userId });
    if (existingRequest) {
      return res.status(400).json({
        message: "You already submitted a vendor request. Please wait for review.",
      });
    }

    // 🧾 bankAccount যদি JSON string হয়ে আসে
    let parsedBank = {};
    try {
      // parse করো string থেকে
      parsedBank = typeof req.body.bankAccount === "string"
        ? JSON.parse(req.body.bankAccount)
        : req.body.bankAccount;
    } catch (error) {
      console.log("⚠️ Bank account JSON parse failed:", error.message);
      parsedBank = {};
    }

    // ☁️ Cloudinary Upload (multiple files)
    let documentUrls = [];

    if (req.files && req.files.length > 0) {
      
      for (const file of req.files) {
        
        const uploaded = await uploadToCloudinary(file.buffer);
        
        documentUrls.push(uploaded.secure_url);
      }
    }

    // 📁 নতুন রিকোয়েস্ট তৈরি
    const newRequest = new VendorRequest({
      userId,
      businessName: clean(businessName),
      businessAddress: clean(businessAddress),
      tradeLicenseNumber: clean(tradeLicenseNumber),
      businessPhone: clean(businessPhone),
      businessEmail: clean(businessEmail),
      bankAccount: {
        accountName: clean(parsedBank?.accountName),
        accountNumber: clean(parsedBank?.accountNumber),
        bankName: clean(parsedBank?.bankName),
        branchName: clean(parsedBank?.branchName),
        bkashNumber: clean(parsedBank?.bkashNumber),
        nagadNumber: clean(parsedBank?.nagadNumber),
      },
      documents: documentUrls,
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "✅ Vendor request submitted successfully. Please wait for admin approval.",
      data: newRequest,
    });
  } catch (error) {
    console.error("❌ Vendor Request Error:", error);
    res.status(500).json({
      message: "Server error while submitting vendor request.",
      error: error.message,
    });
  }
};


// ✅ সব ভেন্ডর রিকোয়েস্ট (অ্যাডমিনের জন্য)
const getAllVendorRequests = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const requests = await VendorRequest.find()
      .populate("userId", "firstName lastName email phone image")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: requests.length, 
      requests 
    });

  } catch (error) {

    console.error("Get Vendor Requests Error:", error);

    res.status(500).json({ 
      message: "Server error while fetching vendor requests." 
    });

  }
};

const approveVendorRequest = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { id } = req.params;
    const request = await VendorRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = "approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.userId;
    await request.save();

    // ✅ যদি approve হয় → ইউজারকে vendor বানাও
    if (request.status === "approved") {
      await User.findByIdAndUpdate(request.userId, {
        $set: {
          isVendor: true,
          vendorAt: new Date(),
        },
      });
    }

    res.json({ success: true, message: "Vendor approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectVendorRequest = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { id } = req.params;
    const request = await VendorRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = "rejected";
    request.adminNote = req.body.adminNote || "";
    request.reviewedAt = new Date();
    request.reviewedBy = req.userId;
    await request.save();

    res.json({ success: true, message: "Vendor rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ নির্দিষ্ট Vendor Request এর ডিটেইল আনা
const getVendorRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧾 রিকোয়েস্ট আইডি চেক
    if (!id) {
      return res.status(400).json({ message: "Vendor request ID is required" });
    }

    // 🔍 ডাটাবেজ থেকে ডেটা আনা
    const request = await VendorRequest.findById(id)
      .populate("userId", "firstName lastName email phone image") // ইউজার ইনফো
      .populate("reviewedBy", "name email role") // অ্যাডমিন ইনফো
      .lean();

    // 🧩 যদি কিছু না পাওয়া যায়
    if (!request) {
      return res.status(404).json({ message: "Vendor request not found" });
    }

    // 🔒 রোল অনুযায়ী চেক (অ্যাডমিন সব দেখতে পারবে, ইউজার কেবল নিজেরটা)
    if (req.role !== "admin" && req.userId.toString() !== request.userId._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ সব ঠিক থাকলে রিটার্ন
    res.status(200).json({
      success: true,
      request,
    });

  } catch (error) {
    console.error("Get Vendor Request Detail Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendor request details",
    });
  }
};

// ✅ নির্দিষ্ট ভেন্ডর রিকোয়েস্ট অনুমোদন / বাতিল
const updateVendorRequestStatus = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const request = await VendorRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Vendor request not found." });
    }

    // ✅ আপডেট করা হচ্ছে
    request.status = status;
    request.reviewedAt = new Date();
    request.reviewedBy = req.userid;

    // ✅ যদি reject হয় → adminNote সেট করো
    if (status === "rejected") {
      request.adminNote = adminNote?.trim() || "No specific reason provided.";
    } else {
      request.adminNote = ""; // যদি approve হয়, তাহলে আগের নোট মুছে দেবে
    }
    await request.save();

    // ✅ যদি approve হয় → ইউজারকে vendor বানাও
    if (status === "approved") {
      await User.findByIdAndUpdate(request.userId, {
        $set: {
          isVendor: true,
          vendorAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Vendor request ${status} successfully.`,
      request,
    });
  } catch (error) {
    console.error("Update Vendor Status Error:", error);
    res.status(500).json({ message: "Server error while updating vendor request." });
  }
};

// ✅ নিজের রিকোয়েস্ট দেখার জন্য
const getMyVendorRequest = async (req, res) => {
  try {
    const userId = req.userid;
    const request = await VendorRequest.findOne({ userId });

    if (!request) {
      return res.status(404).json({ message: "No vendor request found." });
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    console.error("Get My Vendor Request Error:", error);
    res.status(500).json({ message: "Server error while fetching your vendor request." });
  }
};

module.exports = {
    createVendorRequest,
    getAllVendorRequests,
    approveVendorRequest,
    rejectVendorRequest,
    getVendorRequestById,
    updateVendorRequestStatus,
    getMyVendorRequest,
}