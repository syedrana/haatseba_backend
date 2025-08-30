const Withdraw = require("../../models/withdrawModel");
const Wallet = require("../../models/walletModel");


// 🟢 Get Wallet Balance
const getWalletBalance = async (req, res) => {
  try {
    const userId  = req.userid;
    
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }

    res.json({ balance: wallet.cashBalance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟢 User → Request for Withdraw
const requestWithdraw = async (req, res) => {
  try {
    const { amount, method, accountNumber } = req.body;
    const userId = req.userid; // ধরে নিচ্ছি auth middleware user attach করে দিয়েছে

    // 1️⃣ Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!method || !["bkash", "nagad", "bank"].includes(method)) {
      return res.status(400).json({ message: "Invalid method" });
    }
    if (!accountNumber) {
      return res.status(400).json({ message: "Account number required" });
    }

    // 2️⃣ Check Wallet Balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 3️⃣ Save Withdraw Request (Pending)
    const withdraw = new Withdraw({
      userId : userId,
      amount : amount,
      method : method,
      accountNumber : accountNumber,
      status: "pending",
    });
    await withdraw.save();

    return res.status(201).json({
      message: "Withdraw request submitted successfully",
      withdraw,
    });
  } catch (error) {
    console.error("Withdraw Request Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 Admin → Approve Withdraw
const approveWithdraw = async (req, res) => {
  try {
    const { withdrawId } = req.params;

    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw request not found" });
    }
    if (withdraw.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    // Deduct balance from wallet
    const wallet = await Wallet.findOne({ userId: withdraw.userId });
    if (!wallet || wallet.balance < withdraw.amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    wallet.balance -= withdraw.amount;
    await wallet.save();

    withdraw.status = "approved";
    withdraw.approvedAt = new Date();
    await withdraw.save();

    // ✅ Add transaction record
    const transaction = new Transaction({
      userId: withdraw.userId,
      type: "debit",                // টাকা বের হলো
      amount: withdraw.amount,
      bonusType: "withdraw",        // withdraw কারণে
      status: "completed",
    });
    await transaction.save();

    return res.json({
      message: "Withdraw approved successfully",
      withdraw,
      transaction,
      wallet,
    });

  } catch (error) {
    console.error("Approve Withdraw Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 Admin → Reject Withdraw
const rejectWithdraw = async (req, res) => {
  try {
    const { withdrawId } = req.params;

    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw request not found" });
    }
    if (withdraw.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    // ✅ Update withdraw status
    withdraw.status = "rejected";
    withdraw.approvedAt = new Date();
    await withdraw.save();

    // ✅ Transaction entry for rejected withdraw
    const transaction = new Transaction({
      userId: withdraw.userId,
      type: "debit",           // debit try হয়েছিল
      amount: withdraw.amount,
      bonusType: "withdraw",
      status: "failed",        // failed mark করলাম
    });
    await transaction.save();

    return res.json({
      message: "Withdraw rejected successfully",
      withdraw,
      transaction,
    });

  } catch (error) {
    console.error("Reject Withdraw Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getWalletBalance,
  requestWithdraw,
  approveWithdraw,
  rejectWithdraw,
};
