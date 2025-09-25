const User = require("../../models/userModel");

// 🔍 Parent search যোগ করা
const buildSearchQuery = async (extra, search) => {
  const query = { ...extra };

  if (search && search.trim() !== "") {
    const parentMatch = await User.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const parentIds = parentMatch.map((p) => p._id);

    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
      { parentId: { $in: parentIds } }, // 👈 পেরেন্ট দিয়েও সার্চ হবে
    ];
  }

  return query;
};


// 🟡 1. Get Pending Users (search + pagination)
const getPendingUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = { isApproved: false, rejectedAt: null };
    query = await buildSearchQuery(query, search);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, count] = await Promise.all([
      User.find(query)
        .select("firstName lastName email phone image address isEmailVerified createdAt parentId")
        .populate("parentId", "firstName lastName email phone image placementPosition")
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return res.json({
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    console.error("Get Pending Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟢 2. Get Approved Users
const getApprovedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = { isApproved: true };
    query = await buildSearchQuery(query, search);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, count] = await Promise.all([
      User.find(query)
        .select("firstName lastName email phone image address isEmailVerified createdAt parentId")
        .populate("parentId", "firstName lastName email phone image placementPosition")
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return res.json({
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    console.error("Get Approved Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔴 3. Get Rejected Users
const getRejectedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let query = { isRejected: true, rejectedAt: { $ne: null }, isApproved: false };
    query = await buildSearchQuery(query, search);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, count] = await Promise.all([
      User.find(query)
        .select("firstName lastName email phone image address isEmailVerified createdAt parentId")
        .populate("parentId", "firstName lastName email phone image placementPosition")
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return res.json({
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
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