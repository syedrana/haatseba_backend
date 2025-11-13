const User = require("../../models/userModel");
const Wallet = require("../../models/walletModel");
const Withdraw = require("../../models/withdrawModel");
const Bonus = require("../../models/bonusModel");

// 📊 Dashboard Summary
const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalRegistrationIncome = (await User.aggregate([
      { $match: { isDepositPaid: true } },
      { $group: { _id: null, totalAmount: { $sum: "$depositAmount" } } }
    ]))[0]?.totalAmount || 0;

    const totalBonusExpense = (await Bonus.aggregate([
      { $group: { _id: null, costvalue: { $sum: "$costValue" } } }
    ]))[0]?.costvalue || 0;

    const netBalance = totalRegistrationIncome - totalBonusExpense;

    const totalWalletBalance = (await Wallet.aggregate([
      { $group: { _id: null, cashBalance: { $sum: "$cashBalance" } } }
    ]))[0]?.cashBalance || 0;

    const totalWithdraws = (await Withdraw.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]))[0]?.amount || 0;

    const pendingWithdrawsCount = await Withdraw.countDocuments({ status: "pending" });
    const pendingUserCount = await User.countDocuments({ isApproved: false });
    const approvalUserCount = await User.countDocuments({ isApproved: true });
    const rejectedUserCount = await User.countDocuments({ isRejected: true });

    return res.json({
      totalUsers,
      totalRegistrationIncome,
      totalBonusExpense,
      netBalance,
      totalWalletBalance,
      totalWithdraws,
      pendingWithdrawsCount,
      approvalUserCount,
      pendingUserCount,
      rejectedUserCount,
    });
  } catch (error) {
    console.error("Admin Summary Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// 📈 Withdraw Trend (Line/Bar Chart)
const getWithdrawTrend = async (req, res) => {
  try {
    const trend = await Withdraw.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }, // তারিখ অনুযায়ী সাজানো
      { $limit: 7 } // শেষ ৭ দিনের ডাটা
    ]);

    res.json(trend);
  } catch (error) {
    console.error("Withdraw Trend Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// 📝 Latest Withdraw Requests
const getLatestWithdraws = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const withdraws = await Withdraw.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Withdraw.countDocuments();

    res.json({
      withdraws,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Latest Withdraw Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  getAdminSummary,
  getWithdrawTrend,
  getLatestWithdraws,
};