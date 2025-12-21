const TopUp = require("../../models/topupModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
const mongoose = require("mongoose");

const createTopUpRequest = async (req, res) => {
  try {
    const userId = req.userid;
    const { amount, method, reference } = req.body;

    // ✅ Basic validation
    if (!amount || !method || !reference) {
      return res.status(400).json({
        success: false,
        message: "Amount, payment method and reference are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    // ✅ Payment method validation
    const allowedMethods = ["bkash", "nagad", "rocket", "bank"];
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // ✅ Proof validation
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    // Optional: mimetype check
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    // ☁️ Upload to Cloudinary
    const imageResult = await uploadToCloudinary(req.file.buffer);

    // 📝 Create top-up request
    const topup = await TopUp.create({
      userId,
      amount: Number(amount),
      method,
      reference,
      proof: imageResult.secure_url,
      proofPublicId: imageResult.public_id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Top-up request submitted successfully",
      topup,
    });

  } catch (error) {
    // Duplicate reference
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This transaction reference already exists",
      });
    }

    console.error("TopUp Request Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAdminPendingTopUps = async (req, res) => {
  try {
    const topups = await TopUp.find({ status: "pending" })
      .populate("userId", "firstName lastName email phone image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      topups,
    });
  } catch (err) {
    console.error("Get Pending TopUps Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load top-up requests",
    });
  }
};


const approveTopUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.userid;

    // 1️⃣ Fetch topup request
    const topUp = await TopUp.findById(id).session(session);

    if (!topUp) {
      throw new Error("Top-up request not found");
    }

    if (topUp.status !== "pending") {
      throw new Error("Top-up request already processed");
    }

    // 2️⃣ Fetch wallet
    const wallet = await Wallet.findOne({ userId: topUp.userId }).session(session);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // 3️⃣ Credit wallet
    wallet.cashBalance += topUp.amount;
    await wallet.save({ session });

    // 4️⃣ Update topup request
    topUp.status = "approved";
    topUp.processedAt = new Date();
    topUp.processedBy = adminId;
    await topUp.save({ session });

    // 5️⃣ Transaction log
    await Transaction.create(
      [
        {
          userId: topUp.userId,
          type: "credit",
          amount: topUp.amount,
          category: "deposit",
          relatedModel: "TopUp",
          relatedId: topUp._id,
          runningBalance: wallet.cashBalance,
          status: "completed",
          actor: "admin",
          description: "Wallet top-up approved",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Top-up approved successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: err.message || "Failed to approve top-up",
    });
  }
};

const rejectTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userid;
    const { note } = req.body;

    const topUp = await TopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({
        success: false,
        message: "Top-up request not found",
      });
    }

    if (topUp.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Top-up request already processed",
      });
    }

    topUp.status = "rejected";
    topUp.processedAt = new Date();
    topUp.processedBy = adminId;
    topUp.note = note || "Rejected by admin";

    await topUp.save();

    res.json({
      success: true,
      message: "Top-up request rejected",
    });
  } catch (error) {
    console.error("Reject TopUp Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




module.exports = { createTopUpRequest, getAdminPendingTopUps, approveTopUp, rejectTopUp };

