const User = require("../../models/userModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const Bonus = require("../../models/bonusModel");
const {getDownlineCount} = require("../../helpers/downlineCountHelper");

// ✅ User Dashboard Summary
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.userid; // JWT auth middleware থেকে userId আসবে

    // --- Wallet Balance
    const wallet = await Wallet.findOne({ userId });

    // --- Transactions (latest 10)
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // --- Direct Referrals Count
    const user = await User.findById(userId).select("children level referralCode");
    const directReferrals = user?.children?.length || 0;
    const referralCode = user.referralCode;

    // --- Downline Count (recursive বা সহজে শুধু count)
    const downlineCount = await getDownlineCount(userId);

     // --- Total Bonus (only numeric)
    const totalBonus = await Bonus.aggregate([
      { $match: { userId: user._id } },
      {
        $addFields: {
          numericBonus: {
            $convert: {
              input: "$bonusAmount",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$numericBonus" } } },
    ]);

    // --- Bonus History (last 10 bonuses)
    const bonusHistory = await Bonus.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(17);

    res.status(200).json({
      walletBalance: wallet?.cashBalance || 0,
      transactions,
      directReferrals,
      referralCode,
      downlineCount,
      currentLevel: user?.level || 0,
      totalBonus: totalBonus[0]?.total || 0,
      bonusHistory,
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};


module.exports = { getUserDashboard };
