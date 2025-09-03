const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ডেবিট মানে টাকা কাটা, ক্রেডিট মানে টাকা যোগ
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },

  // লেনদেনের পরিমাণ
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"],
  },

  // লেনদেনের ধরণ/ক্যাটাগরি
  category: {
    type: String,
    enum: ["withdraw", "deposit", "bonus", "transfer", "refund"],
    required: true,
  },

  // সম্পর্কিত ডকুমেন্ট (Withdraw/Deposit/Bonus ইত্যাদি)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
  },

  // সম্পর্কিত মডেলের নাম (Dynamic reference)
  relatedModel: {
    type: String,
    enum: ["Withdraw", "Deposit", "Bonus", "Order"],
  },

  // বর্ণনা (optional but helpful)
  description: {
    type: String,
    maxlength: 255,
    trim: true,
  },

  // লেনদেনের স্ট্যাটাস
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },

  // লেনদেনের পর ইউজারের ব্যালেন্স কত দাঁড়ালো
  runningBalance: {
    type: Number,
  },

  // কে লেনদেন করেছে (system, admin, user)
  actor: {
    type: String,
    enum: ["system", "admin", "user"],
    default: "user",
  },

  // একাধিকবার ডুপ্লিকেট এন্ট্রি ঠেকাতে
  idempotencyKey: {
    type: String,
    index: true,
    unique: false, // same key multiple users can have
    sparse: true,
  },

  // কখন approve/reject হলো
  processedAt: Date,

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
