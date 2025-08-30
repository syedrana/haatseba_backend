const User = require("../../models/userModel");
const bcrypt = require("bcrypt");

// GET /me
const getProfile = async (req, res) => {
  try {
    const userId = req?.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("parentId", "firstName lastName email phone level").select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getOwnProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("parentId", "firstName lastName email phone level").select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getDashboardProfile = async (req, res) => {
  try {
    const userId = req?.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select(" firstName lastName email image role");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getDashboardProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /me  (update profile fields)
const updateProfile = async (req, res) => {
  try {
    const userId = req?.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Whitelist fields that can be updated
    const { firstName, lastName, phone, address, avatar } = req.body;

    const updates = {};
    if (typeof firstName === "string") updates.firstName = firstName.trim();
    if (typeof lastName === "string") updates.lastName = lastName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof address === "string") updates.address = address.trim();
    if (typeof avatar === "string") updates.avatar = avatar.trim();

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password -__v");
    res.json(user);
  } catch (err) {
    console.error("updateProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /me/password
const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both current and new passwords are required" });

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });

    // Validate new password (example rule)
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("updatePassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile, getOwnProfile, getDashboardProfile, updateProfile, updatePassword };
