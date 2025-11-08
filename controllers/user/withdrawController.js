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
    if (!wallet || wallet.cashBalance < amount) {
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


// ✅ User Withdraw History
const getWithdrawHistory = async (req, res) => {
  try {
    const userId = req.userid;
    const history = await Withdraw.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



module.exports = {
  getWalletBalance,
  requestWithdraw,
  getWithdrawHistory,
};
