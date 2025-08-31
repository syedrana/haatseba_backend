const User = require("../../models/userModel");
const Wallet = require("../../models/walletModel");
const Withdraw = require("../../models/withdrawModel");

// 📊 Dashboard Summary
const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWalletBalance = (await Wallet.aggregate([
      { $group: { _id: null, balance: { $sum: "$balance" } } }
    ]))[0]?.balance || 0;


    // const totalDeposits = await Deposit.aggregate([
    //   { $match: { status: "approved" } },
    //   { $group: { _id: null, amount: { $sum: "$amount" } } }
    // ]);

    const totalWithdraws = await Withdraw.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    const pendingWithdrawsCount = await Withdraw.countDocuments({ status: "pending" });
    const pendingUserCount = await User.countDocuments({ isApproved: "false" });
    const approvalUserCount = await User.countDocuments({ isApproved: "true" });
    const rejectedUserCount = await User.countDocuments({ isRejected: "true" });

    return res.json({
      totalUsers,
      totalWalletBalance: totalWalletBalance[0]?.balance || 0,
      //pendingUser: totalDeposits[0]?.amount || 0,
      totalWithdraws: totalWithdraws[0]?.amount || 0,
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