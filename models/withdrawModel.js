const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  method: {
    type: String,
    enum: ["bkash", "nagad", "bank"],
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
