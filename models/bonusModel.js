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
      type: String, 
      required: [true, "Bonus amount is required"],
      trim: true,
      maxlength: [100, "Bonus amount cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "paid"],
        message: "Status must be pending, approved, or paid",
      },
      default: "pending",
      lowercase: true,
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
