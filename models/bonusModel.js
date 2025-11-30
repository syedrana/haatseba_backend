const mongoose = require("mongoose");

const bonusSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
      min: [1, "Level cannot be less than 1"],
      max: [17, "Level cannot be more than 17"],
      validate: {
        validator: Number.isInteger,
        message: "Level must be an integer",
      },
    },
    bonusAmount: {
      type: mongoose.Schema.Types.Mixed, 
      required: [true, "Bonus amount is required"],
      //trim: true,
      //maxlength: [100, "Bonus amount cannot exceed 100 characters"],
    },
    rewardType: {  
      type: String,
      enum: ["cash", "product", "mobile_recharge", "high_value", "real_estate", "none"],
      default: "cash",
    },
    costValue: {
      type: Number,
      default: 0, 
      min: 0,
    },
    hasBonus: {
      type: Boolean,
      default: true, 
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending", 
          "approved", 
          "paid",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "not_applicable",
          "handover_ready", // high-value ready to receive
          "handover_done",  // motorbike/car delivered
          "documents_ready",
          "documents_done",
          "completed"
        ],
        message: "Status must be pending, approved, or paid",
      },
      default: "pending",
      lowercase: true,
      trim: true,
    },
    rechargeNumber: {
      type: String,
      default: null,
    },

    rechargedAt: {
      type: Date,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
      trim: true,
    },
    adminNote: {
      type: String,
      maxlength: [255, "Note cannot exceed 255 characters"],
      trim: true,
    },
    note: {
      type: String,
      maxlength: [255, "Note cannot exceed 255 characters"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      immutable: true,
    }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bonus", bonusSchema);
