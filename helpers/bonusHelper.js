const Bonus = require("../models/bonusModel");
const Wallet = require("../models/walletModel");

async function giveBonus(userId, level) {
  const bonusAmounts = {
    1: "Mobile Recharge",
    2: "No bonus",
    3: "T-Shirt",
    4: "No bonus",
    5: "Button-Phone",
    6: "No bonus",
    7: "Dinar-Set",
    8: "No bonus",
    9: "Smart-Phone",
    10: "No bonus",
    11: "Motor-Bike",
    12: "No bonus",
    13: "Tour",
    14: "No bonus",
    15: "Car",
    16: "No bonus",
    17: "Flat",
  };

  const reward = bonusAmounts[level] || 0;

  if (reward.toLowerCase().includes("no bonus")) {
    console.log(`⏭️ No bonus for level ${level} (User: ${userId})`);
    return;
  }

  const bonus = new Bonus({
    userId: userId,
    level: level,
    bonusAmount: reward,
    status: "pending"
  });

  await bonus.save();

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId });
  }

  wallet.rewards.push({ item: reward });
  await wallet.save();

  console.log(`🎁 Bonus Given → User: ${userId} | Level: ${level}`);
}

module.exports = { giveBonus };
