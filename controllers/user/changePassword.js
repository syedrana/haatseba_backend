const bcrypt = require("bcryptjs");
const User = require("../../models/userModel");

const changePassword = async (req, res) => {
  try {
    const userId = req.userid;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required!" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect!" });
    }

    // Update new password
    //const hashed = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: "Password changed successfully!" });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = changePassword;
