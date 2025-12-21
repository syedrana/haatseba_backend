const mongoose = require("mongoose");

const topUpRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Minimum top-up amount is 1"],
    },

    method: {
      type: String,
      enum: {
        values: ["bkash", "nagad", "rocket", "bank"],
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
    },

    reference: {
      type: String,
      required: [true, "Transaction reference is required"],
      trim: true,
      unique: true,
      minlength: 5,
      maxlength: 100,
    },

    proof: {
      type: String,
      trim: true,
      required: [true, "proof is required"],
    },

    proofPublicId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// 🔒 prevent duplicate reference (fraud control)
topUpRequestSchema.index(
  { userId: 1, reference: 1 },
  { unique: true }
);

module.exports = mongoose.model("TopUp", topUpRequestSchema);
