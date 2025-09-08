// routes/adminTransactionRoutes.js
const express = require("express");
const Transaction = require("../../models/transactionModel");
const User = require("../../models/userModel"); // user info show করার জন্য
const router = express.Router();

// ✅ Transaction List (with filters + pagination)
const transaction = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      userId,
      type,
      category,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    const transactions = await Transaction.find(filter)
      .populate("userId", "firstName lastName email") // user info
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      data: transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Transaction Details
const transDetaiols = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("userId", "firstName lastName email")
      .populate("relatedId"); // dynamic ref based on relatedModel

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {transaction, transDetaiols};
