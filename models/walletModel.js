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
    min: [0, "Balance cannot be negative"],
  },
  rewards: [
    {
      item: { type: String, required: true }, // Gift / Product
      date: { type: Date, default: Date.now },
      bonusRef:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bonus",
        required: true,
      }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);

