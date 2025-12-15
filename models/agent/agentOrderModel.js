const mongoose = require("mongoose");

const agentOrderSchema = new mongoose.Schema(
  {
    // 👤 যে ইউজার এজেন্ট হতে চাইছে
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // 📦 কোন প্যাকেজ / প্রোডাক্ট কিনছে
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: [true, "Package ID is required"],
      index: true,
    },

    // 🔢 কত পরিমাণ প্রোডাক্ট নিবে
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Minimum quantity must be 1"],
      max: [1000, "Quantity cannot exceed 1000"], 
      default: 1,
    },

    // 💳 পেমেন্ট টাইপ
    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: {
        values: ["cod", "online"],
        message: "Payment type must be either 'cod' or 'online'",
      },
    },

    // 💰 মোট টাকা
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },

    // 📌 স্ট্যাটাস: pending / approved / rejected
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved or rejected",
      },
      default: "pending",
      index: true,
    },

    // 👨‍💼 কোন অ্যাডমিন approve করেছে
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 🕒 অনুমোদন সময়
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔒 Prevent update of userId or packageId after creation
agentOrderSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.userId || update.packageId) {
    return next(new Error("You cannot change userId or packageId after order creation"));
  }

  next();
});

module.exports = mongoose.model("AgentOrder", agentOrderSchema);
