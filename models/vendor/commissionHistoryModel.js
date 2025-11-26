// models/commissionHistoryModel.js
const mongoose = require("mongoose");

const commissionHistorySchema = new mongoose.Schema(
  {
    commission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    oldRate: {
      type: Number,
    },
    newRate: {
      type: Number,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Admin যিনি পরিবর্তন করেছেন
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommissionHistory", commissionHistorySchema);
