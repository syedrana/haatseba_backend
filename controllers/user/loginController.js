const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 🔹 identifier মানে: Email বা Referral Code — যেকোনোটা
    if (!identifier) {
      return res.status(400).send("Email or Referral Code is required");
    }

    if (!password) {
      return res.status(400).send("Password is required");
    }

    // 🔹 Email বা Referral Code দিয়ে ইউজার খোঁজা
    let existingUser = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { referralCode: identifier.toUpperCase() },
      ],
    }).select("+password");

    if (!existingUser) {
      return res.status(400).send("Invalid credentials");
    }

    // ✅ Check if user is email verification
    // if (!existingUser.isVerified) {
    //     return res.status(400).send("Your account is pending Email Verification.");
    // } 

    // ✅ Check if user is approved by admin
    if (!existingUser.isApproved) {
      return res.status(400).send("Your account is pending admin approval.");
    }

    // ✅ Password match check
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    // ✅ JWT টোকেন তৈরি
    const token = jwt.sign(
      {
        username: `${existingUser.firstName} ${existingUser.lastName}`,
        userid: existingUser._id,
        role: existingUser.role,
        referralCode: existingUser.referralCode,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "23h",
      }
    );

    // ✅ Successful Login Response
    res.status(200).json({
      access_token: token,
      message: "Login Successful",
      role: existingUser.role,
      referralCode: existingUser.referralCode,
      name: `${existingUser.firstName} ${existingUser.lastName}`,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    // ❌ এখানে ছোট ভুল ছিল — res.status(400).status(...)
    res.status(500).send("Internal Server Error");
  }
};

module.exports = login;
