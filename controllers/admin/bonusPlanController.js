const BonusPlan = require("../../models/bonusPlanModel");

// ✅ Create Bonus Plan
const createBonusPlan = async (req, res) => {
  try {
    const { level, bonusAmount, rewardType, condition, status } = req.body;

    const existing = await BonusPlan.findOne({ level });
    if (existing) {
      return res.status(400).json({ message: "This level already exists!" });
    }

    const newBonus = new BonusPlan({ level, bonusAmount, rewardType, condition, status });
    await newBonus.save();

    res.status(201).json({ message: "Bonus plan created successfully", bonus: newBonus });
  } catch (error) {
    res.status(500).json({ message: "Error creating bonus plan", error: error.message });
  }
};

// ✅ Get All Bonus Plans
const getAllBonusPlans = async (req, res) => {
  try {
    const plans = await BonusPlan.find().sort({ level: 1 });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bonus plans", error: error.message });
  }
};

// ✅ Update Bonus Plan
const updateBonusPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BonusPlan.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: "Bonus plan updated", bonus: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating bonus plan", error: error.message });
  }
};

// ✅ Delete Bonus Plan
const deleteBonusPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await BonusPlan.findByIdAndDelete(id);
    res.status(200).json({ message: "Bonus plan deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bonus plan", error: error.message });
  }
};

module.exports = {
  createBonusPlan,
  getAllBonusPlans,
  updateBonusPlan,
  deleteBonusPlan,
};
