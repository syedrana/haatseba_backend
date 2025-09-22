const mongoose = require("mongoose");
const Withdrawal = require("../../models/withdrawModel"); // আপনি যা ব্যবহার করছেন
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel"); // ensure this path is correct


// 🛠️ Common history fetcher
const getWithdrawHistory = async (req, res, statusFilter) => {
  try {
    const { page = 1, limit = 10, sort = "desc", userId, method, startDate, endDate } = req.query;

    const query = { status: statusFilter };

    // 🔍 Filters
    if (userId) query.userId = userId;
    if (method) query.method = method;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // 📌 Pagination & Sorting
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: sort === "asc" ? 1 : -1 },
      populate: { path: "userId", select: "firstName lastName email phone image level" }
    };

    // Withdraw history
    const withdraws = await Withdrawal.find(query)
      .populate("userId", "firstName lastName email phone image level")
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    // Total count
    const count = await Withdrawal.countDocuments(query);

    // 🔗 Merge with transactions
    const withdrawsWithTx = await Promise.all(
      withdraws.map(async (w) => {
        const tx = await Transaction.findOne({ relatedId: w._id, category: "withdraw" }).lean();
        return { ...w.toObject(), transaction: tx || null };
      })
    );

    res.json({
      status: statusFilter,
      page: options.page,
      limit: options.limit,
      count,
      totalPages: Math.ceil(count / options.limit),
      withdraws: withdrawsWithTx,
    });

  } catch (error) {
    console.error("Withdraw History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 1. Get all pending approval Withdrawal
const getPendingWithdrawal = async (req, res) => {
  return getWithdrawHistory(req, res, "pending");
};

// 🟢 2. Get all approved Withdrawal
const getApprovedWithdrawal = async (req, res) => {
  return getWithdrawHistory(req, res, "approved");
};

// 🔴 3. Get all rejected Withdrawal
const getRejectedWithdrawal = async (req, res) => {
  return getWithdrawHistory(req, res, "rejected");
};

// 🟡 Admin → Approve Withdraw (atomic with mongoose transaction)
const approveWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    // use Withdrawal (consistent name)
    const withdraw = await Withdrawal.findById(id).session(session);
    if (!withdraw) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Withdraw request not found" });
    }
    if (withdraw.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: withdraw.userId }).session(session);
    if (!wallet || Number(wallet.balance) < Number(withdraw.amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // update balance (consider cents or Decimal128 in production)
    wallet.cashBalance = Number(wallet.cashBalance) - Number(withdraw.amount);
    await wallet.save({ session });

    withdraw.status = "approved";
    withdraw.approvedAt = new Date();
    await withdraw.save({ session });

    const transaction = new Transaction({
      userId: withdraw.userId,
      type: "debit",
      amount: withdraw.amount,
      category: "withdraw",
      relatedId: withdraw._id,
      relatedModel: "Withdraw",
      description: `Withdraw approved via ${withdraw.method || "N/A"} (${withdraw.accountNumber || "N/A"})`,
      status: "completed",
      runningBalance: wallet.cashBalance,
      actor: "admin",
      processedAt: new Date(),
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Withdraw approved successfully",
      withdraw,
      transaction,
      wallet,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Approve Withdraw Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 Admin → Reject Withdraw
const rejectWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const withdraw = await Withdrawal.findById(id).session(session);
    if (!withdraw) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Withdraw request not found" });
    }
    if (withdraw.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Already processed" });
    }

    withdraw.status = "rejected";
    withdraw.approvedAt = new Date(); // maybe renamed to processedAt if preferred
    await withdraw.save({ session });

    // get current wallet balance for runningBalance in transaction
    const wallet = await Wallet.findOne({ userId: withdraw.userId }).session(session);

    const transaction = new Transaction({
      userId: withdraw.userId,
      type: "debit", // attempted debit
      amount: withdraw.amount,
      category: "withdraw",
      relatedId: withdraw._id,
      relatedModel: "Withdraw",
      description: `Withdraw rejected (method: ${withdraw.method || "N/A"})`,
      status: "failed",
      runningBalance: wallet ? wallet.cashBalance : 0,
      actor: "admin",
      processedAt: new Date(),
    });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Withdraw rejected successfully",
      withdraw,
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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