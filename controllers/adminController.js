const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const Withdraw = require("../models/withdrawModel");
const Deposit = require("../models/depositModel");
const Transaction = require("../models/transactionModel");

// 📊 Dashboard Summary
const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWalletBalance = (await Wallet.aggregate([
      { $group: { _id: null, balance: { $sum: "$balance" } } }
    ]))[0]?.balance || 0;


    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    const totalWithdraws = await Withdraw.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    const pendingWithdraws = await Withdraw.countDocuments({ status: "pending" });
    const pendingDeposits = await Deposit.countDocuments({ status: "pending" });

    return res.json({
      totalUsers,
      totalWalletBalance: totalWalletBalance[0]?.balance || 0,
      totalDeposits: totalDeposits[0]?.amount || 0,
      totalWithdraws: totalWithdraws[0]?.amount || 0,
      pendingWithdraws,
      pendingDeposits,
    });
  } catch (error) {
    console.error("Admin Summary Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 Admin → Get Users Count Summary
const getUsersCountSummary = async (req, res) => {
  try {
    const pendingCount = await User.countDocuments({
      isApproved: false,
      rejectedAt: null,
    });

    const approvedCount = await User.countDocuments({
      isApproved: true,
    });

    const rejectedCount = await User.countDocuments({
      rejectedAt: { $ne: null },
    });

    return res.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount,
    });
  } catch (error) {
    console.error("Get Users Count Summary Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 1. Get all pending approval users
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      isApproved: false,
      rejectedAt: null,   // 🚩 এখনো reject হয়নি
    }).select("-password");

    return res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Pending Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟢 2. Get all approved users
const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({
      isApproved: true,
    }).select("-password");

    return res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Approved Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 3. Get all rejected users
const getRejectedUsers = async (req, res) => {
  try {
    const users = await User.find({
      rejectedAt: { $ne: null }, // 🚩 যাদের reject করা হয়েছে
      isApproved: false,         // safe check
    }).select("-password");

    return res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Rejected Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟢 Admin → Approve User
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isApproved === true) {
      return res.status(400).json({ message: "User already approved" });
    }

    user.isApproved = true;
    user.approvedAt = new Date();
    await user.save();

    // ✅ Update pending list
    const pendingUsers = await User.find({
      isApproved: false,
      rejectedAt: null,
    }).select("-password");

    return res.json({
      message: "User approved successfully",
      user,
      pending: {
        count: pendingUsers.length,
        users: pendingUsers,
      },
    });
  } catch (error) {
    console.error("Approve User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 Admin → Reject User
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.rejectedAt) {
      return res.status(400).json({ message: "User already rejected" });
    }

    user.isApproved = false;
    user.rejectedAt = new Date();
    await user.save();

    // ✅ Update pending list
    const pendingUsers = await User.find({
      isApproved: false,
      rejectedAt: null,
    }).select("-password");

    return res.json({
      message: "User rejected successfully",
      user,
      pending: {
        count: pendingUsers.length,
        users: pendingUsers,
      },
    });
  } catch (error) {
    console.error("Reject User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 Pending Withdraws
const getPendingWithdraws = async (req, res) => {
  try {
    const withdraws = await Withdraw.find({ status: "pending" }).populate("userId", "name email");
    res.json(withdraws);
  } catch (error) {
    console.error("Pending Withdraws Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟡 Pending Deposits
const getPendingDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "pending" }).populate("userId", "name email");
    res.json(deposits);
  } catch (error) {
    console.error("Pending Deposits Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 👥 User List
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email phone createdAt isApproved");
    res.json(users);
  } catch (error) {
    console.error("User List Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAdminSummary,
  getUsersCountSummary,
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  approveUser,
  rejectUser,
  getPendingWithdraws,
  getPendingDeposits,
  getAllUsers,
};













// const User = require("../models/userModel");
// const Wallet = require("../models/walletModel");
// const Withdraw = require("../models/withdrawModel");
// const Deposit = require("../models/depositModel");
// const Transaction = require("../models/transactionModel");

// // 📊 Dashboard Summary
// const getAdminSummary = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();

//     const totalWalletBalance = await Wallet.aggregate([
//       { $group: { _id: null, balance: { $sum: "$balance" } } }
//     ]);

//     const totalDeposits = await Deposit.aggregate([
//       { $match: { status: "approved" } },
//       { $group: { _id: null, amount: { $sum: "$amount" } } }
//     ]);

//     const totalWithdraws = await Withdraw.aggregate([
//       { $match: { status: "approved" } },
//       { $group: { _id: null, amount: { $sum: "$amount" } } }
//     ]);

//     const pendingWithdraws = await Withdraw.countDocuments({ status: "pending" });
//     const pendingDeposits = await Deposit.countDocuments({ status: "pending" });

//     return res.json({
//       totalUsers,
//       totalWalletBalance: totalWalletBalance[0]?.balance || 0,
//       totalDeposits: totalDeposits[0]?.amount || 0,
//       totalWithdraws: totalWithdraws[0]?.amount || 0,
//       pendingWithdraws,
//       pendingDeposits,
//     });
//   } catch (error) {
//     console.error("Admin Summary Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 👥 User Count Summary
// const getUsersCountSummary = async (req, res) => {
//   try {
//     const pending = await User.countDocuments({ isApproved: false, rejectedAt: null });
//     const approved = await User.countDocuments({ isApproved: true });
//     const rejected = await User.countDocuments({ rejectedAt: { $ne: null } });

//     return res.json({
//       pending,
//       approved,
//       rejected,
//       total: pending + approved + rejected,
//     });
//   } catch (error) {
//     console.error("Get Users Count Summary Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 🟡 Pending Users
// const getPendingUsers = async (req, res) => {
//   try {
//     const users = await User.find({ isApproved: false, rejectedAt: null });
//     return res.json({ count: users.length, users });
//   } catch (error) {
//     console.error("Get Pending Users Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 🟢 Approved Users
// const getApprovedUsers = async (req, res) => {
//   try {
//     const users = await User.find({ isApproved: true });
//     return res.json({ count: users.length, users });
//   } catch (error) {
//     console.error("Get Approved Users Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 🔴 Rejected Users
// const getRejectedUsers = async (req, res) => {
//   try {
//     const users = await User.find({ rejectedAt: { $ne: null }, isApproved: false });
//     return res.json({ count: users.length, users });
//   } catch (error) {
//     console.error("Get Rejected Users Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // ✅ Approve User
// const approveUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     if (user.isApproved) return res.status(400).json({ message: "User already approved" });

//     user.isApproved = true;
//     user.approvedAt = new Date();
//     await user.save();

//     const pendingUsers = await User.find({ isApproved: false, rejectedAt: null });

//     return res.json({
//       message: "User approved successfully",
//       user,
//       pending: { count: pendingUsers.length, users: pendingUsers },
//     });
//   } catch (error) {
//     console.error("Approve User Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // ❌ Reject User
// const rejectUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     if (user.rejectedAt) return res.status(400).json({ message: "User already rejected" });

//     user.isApproved = false;
//     user.rejectedAt = new Date();
//     await user.save();

//     const pendingUsers = await User.find({ isApproved: false, rejectedAt: null });

//     return res.json({
//       message: "User rejected successfully",
//       user,
//       pending: { count: pendingUsers.length, users: pendingUsers },
//     });
//   } catch (error) {
//     console.error("Reject User Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 🟡 Pending Withdraws
// const getPendingWithdraws = async (req, res) => {
//   try {
//     const withdraws = await Withdraw.find({ status: "pending" }).populate("userId", "name email");
//     res.json(withdraws);
//   } catch (error) {
//     console.error("Pending Withdraws Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 🟡 Pending Deposits
// const getPendingDeposits = async (req, res) => {
//   try {
//     const deposits = await Deposit.find({ status: "pending" }).populate("userId", "name email");
//     res.json(deposits);
//   } catch (error) {
//     console.error("Pending Deposits Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // 👥 All Users
// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select("name email phone createdAt isApproved");
//     res.json(users);
//   } catch (error) {
//     console.error("User List Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// module.exports = {
//   getAdminSummary,
//   getUsersCountSummary,
//   getPendingUsers,
//   getApprovedUsers,
//   getRejectedUsers,
//   approveUser,
//   rejectUser,
//   getPendingWithdraws,
//   getPendingDeposits,
//   getAllUsers,
// };
