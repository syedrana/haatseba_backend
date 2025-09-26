const jwt = require("jsonwebtoken");
const User = require("../../models/userModel");

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verification-failed?reason=missing`);
    }

    // ✅ টোকেন যাচাই
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ ইউজার খুঁজে বের করা
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verification-failed?reason=invalid-user`);
    }

    // ✅ যদি আগেই ভেরিফাই হয়ে থাকে
    if (user.isVerified) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verified`);
    }

    // ✅ এখন ভেরিফাই করে দাও
    user.isVerified = true;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verified`);
  } catch (error) {
    console.error("Email verification error:", error);

    // ✅ যদি টোকেন এক্সপায়ার হয়ে যায়
    if (error.name === "TokenExpiredError") {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verification-failed?reason=expired`);
    }

    // ✅ অন্য কোনো কারণে ব্যর্থ
    return res.redirect(`${process.env.FRONTEND_BASE_URL}/email-verification-failed?reason=invalid`);
  }
};

module.exports = verifyEmail;
