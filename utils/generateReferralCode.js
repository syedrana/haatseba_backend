const crypto = require("crypto");
const User = require("../models/userModel");

async function generateUniqueReferralCode(firstName, lastName) {
  // নামের প্রথম অক্ষর
  const firstLetter = firstName?.charAt(0)?.toUpperCase() || "X";
  const lastLetter = lastName?.charAt(0)?.toUpperCase() || "Z";

  // তারিখ অংশ (দিন, মাস, বছর)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  // 10-অক্ষরের random প্রিফিক্স (secure)
  const randomPart = crypto.randomBytes(5).toString("base64").replace(/[^A-Z0-9]/gi, "").slice(0, 10).toUpperCase();

  // পুরো কোড তৈরি
  let referralCode = `${firstLetter}${lastLetter}${day}${month}${year}${randomPart}`;

  // ইউনিক কিনা চেক করো
  let exists = await User.exists({ referralCode });
  while (exists) {
    const newRandom = crypto.randomBytes(5).toString("base64").replace(/[^A-Z0-9]/gi, "").slice(0, 10).toUpperCase();
    referralCode = `${firstLetter}${lastLetter}${day}${month}${year}${newRandom}`;
    exists = await User.exists({ referralCode });
  }

  return referralCode;
}

module.exports = generateUniqueReferralCode;
