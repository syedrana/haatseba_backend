const User = require("../../models/userModel");

// 🟡 1. Get all pending approval users
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      isApproved: false,
      rejectedAt: null,   // 🚩 এখনো reject হয়নি
    }).populate("firstName lastName email phone image").select("-password");

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
    }).populate("firstName lastName email phone image").select("-password");

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
      isRejected: true,
      rejectedAt: { $ne: null }, // 🚩 যাদের reject করা হয়েছে
      isApproved: false,         // safe check
    }).populate("firstName lastName email phone image").select("-password");

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
    const { id } = req.params;

    const user = await User.findById(id);
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
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.rejectedAt) {
      return res.status(400).json({ message: "User already rejected" });
    }

    user.isApproved = false;
    user.isRejected = true,
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


module.exports = {
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  approveUser,
  rejectUser,
};