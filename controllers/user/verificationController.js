const jwt = require("jsonwebtoken");
const User = require("../../models/userModel");

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) return res.status(400).json({ message: "Token is missing." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isEmailVerified) return res.status(400).json({ message: "Already verified." });

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Email verification error:", err.message);
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyEmail;
