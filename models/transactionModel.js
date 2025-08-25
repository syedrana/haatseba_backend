const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"],
  },
  description: {
    type: String,
    maxlength: 255,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "failed"],
    default: "approved",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
