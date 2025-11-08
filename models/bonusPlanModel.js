const mongoose = require("mongoose");

const bonusPlanSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
  },
  bonusAmount: {
    type: mongoose.Schema.Types.Mixed, // number or string
    required: true,
  },
  rewardType: {
    type: String,
    enum: ["cash", "product", "other"],
    required: true,
    default: "",
  },
  condition: {
    type: String,
    required: true,
    default: "",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true,
    default: "active",
  },
}, { timestamps: true });

module.exports = mongoose.model("BonusPlan", bonusPlanSchema);
