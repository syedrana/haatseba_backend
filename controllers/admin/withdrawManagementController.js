const Withdrawal = require("../../models/withdrawModel");
const Wallet = require("../../models/walletModel");

// 🟡 1. Get all pending approval Withdrawal
const getPendingWithdrawal = async (req, res) => {
  try {
    const withdraws = await Withdrawal.find({
      status: "pending", 
    }).populate("userId", "firstName lastName email phone image level");

    return res.json({
      count: withdraws.length,
      withdraws,
    });
  } catch (error) {
    console.error("Get Pending withdrawal Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟢 2. Get all approved Withdrawal
const getApprovedWithdrawal = async (req, res) => {
  try {
    const withdraws = await Withdrawal.find({
      status: "approved",
    }).populate("userId", "firstName lastName email phone image level");

    return res.json({
      count: withdraws.length,
      withdraws,
    });
  } catch (error) {
    console.error("Get Approved Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 3. Get all rejected Withdrawal
const getRejectedWithdrawal = async (req, res) => {
  try {
    const withdraws = await Withdrawal.find({
      status: "rejected",        // safe check
    }).populate("userId", "firstName lastName email phone image level");

    return res.json({
      count: withdraws.length,
      withdraws,
    });
  } catch (error) {
    console.error("Get Rejected Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 Admin → Approve Withdraw
const approveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;

    const withdraw = await Withdraw.findById(id);
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
      description: "withdraw",        // withdraw কারণে
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
    const { id } = req.params;

    const withdraw = await Withdraw.findById(id);
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
      description: "withdraw",
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
  getPendingWithdrawal,
  getApprovedWithdrawal,
  getRejectedWithdrawal,
  approveWithdraw,
  rejectWithdraw,
};