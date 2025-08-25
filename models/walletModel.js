const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  cashBalance: {
    type: Number,
    default: 0, // টাকা
  },
  rewards: [
    {
      item: { type: String, required: true }, // Gift / Product
      date: { type: Date, default: Date.now },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);

