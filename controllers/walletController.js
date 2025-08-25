const express = require("express");
const router = express.Router();

const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");

// ================================
// ✅ 1. Get Wallet Balance
// ================================
router.get("/balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }

    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================================
// ✅ 2. Get Transaction History
// ================================
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // সর্বশেষ ৫০টা ট্রানজেকশন show করবে

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================================
// ✅ 3. Withdraw Request
// ================================
router.post("/withdraw", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "UserId and Amount required" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ Transaction এ debit entry
    const withdrawTx = await Transaction.create({
      userId,
      type: "debit",
      amount,
      description: "Withdraw Request",
      status: "pending", // admin approve করবে
    });

    // ✅ Balance এখনই deduct করব না (pending থাকবে)
    res.json({ message: "Withdraw request submitted", transaction: withdrawTx });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================================
// ✅ 4. Approve Withdraw (Admin)
// ================================
router.post("/withdraw/approve", async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Transaction already processed" });
    }

    // ✅ Wallet Update
    const wallet = await Wallet.findOne({ userId: transaction.userId });
    if (!wallet || wallet.balance < transaction.amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= transaction.amount;
    await wallet.save();

    transaction.status = "approved";
    await transaction.save();

    res.json({ message: "Withdraw approved", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
