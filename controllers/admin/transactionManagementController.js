// routes/adminTransactionRoutes.js
const express = require("express");
const Transaction = require("../../models/transactionModel");
const User = require("../../models/userModel");
const router = express.Router();

// ✅ Transaction List (with filters + pagination + multi-field search)
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

    // ✅ Multi-field search
    if (search) {
      const users = await User.find(
        {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
        { _id: 1 }
      );

      const userIds = users.map((u) => u._id);

      const orConditions = [
        { description: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { actor: { $regex: search, $options: "i" } },
        { idempotencyKey: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
      ];

      // যদি নাম্বার হয়, তখন amount / runningBalance চেক করো
      if (!isNaN(search)) {
        orConditions.push({ amount: Number(search) });
        orConditions.push({ runningBalance: Number(search) });
      }

      filter.$or = orConditions;
    }


    const transactions = await Transaction.find(filter)
      .populate("userId", "firstName lastName email")
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
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Transaction Details (unchanged)
const transDetaiols = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("userId", "firstName lastName email")
      .populate("relatedId");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { transaction, transDetaiols };
