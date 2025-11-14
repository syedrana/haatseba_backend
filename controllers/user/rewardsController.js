const Bonus = require("../../models/bonusModel");

const getMyRewards = async (req, res) => {
  try {
    const userId = req.userid; // middleware sets
    const bonuses = await Bonus.find({ userId }).sort({ createdAt: -1 });
    return res.json(bonuses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch bonuses" });
  }
};

module.exports = { getMyRewards };