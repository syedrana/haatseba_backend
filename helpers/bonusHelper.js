const Bonus = require("../models/bonusModel");

async function giveBonus(userId, level) {
  const bonusAmounts = {
    1: 100,
    2: 200,
    3: 400,
    4: 800,
    5: 1600,
    6: 3200,
    7: 6400,
    8: 12800,
    9: 25600,
    10: 51200,
    11: 102400,
    12: 204800,
    13: 409600,
    14: 819200,
    15: 1638400,
    16: 3276800,
    17: 6553600,
  };

  const bonus = new Bonus({
    userId: userId,
    level: level,
    bonusAmount: bonusAmounts[level] || 0,
    status: "pending"
  });

  await bonus.save();
  console.log(`🎁 Bonus Given → User: ${userId} | Level: ${level}`);
}

module.exports = { giveBonus };
