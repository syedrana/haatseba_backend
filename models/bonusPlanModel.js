const mongoose = require("mongoose");

const bonusPlanSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
  },
  bonusAmount: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (v) {
        return typeof v === "number" || typeof v === "string";
      },
      message: "Bonus amount must be a number or string",
    },
  },
  costValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  rewardType: {
    type: String,
    enum: ["cash", "product", "other"],
    required: true,
    default: "cash",
  },
  condition: {
    type: String,
    required: true,
    trim: true,
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
