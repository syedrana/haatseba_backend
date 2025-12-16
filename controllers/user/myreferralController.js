const User = require("../../models/userModel");

const getReferralCode = async (req, res) => {
  try {
    const userId = req.userid; // ✅ auth middleware থেকে

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId)
      .select("referralCode children")
      .populate({
        path: "children",
        select: "firstName lastName email phone level referralCode referralLocked children image createdAt"
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      referralCode: user.referralCode,
      children: user.children,      
      totalChildren: user.children?.length || 0
    });

  } catch (err) {
    console.error("getReferralCode error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = getReferralCode;
