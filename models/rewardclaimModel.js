const mongoose = require("mongoose");

const rewardClaimSchema = new mongoose.Schema(
  {
    bonusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bonus",
      required: [true, "Bonus ID is required"],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "approved",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],
        message: "Invalid claim status",
      },
      default: "pending",
      lowercase: true,
      trim: true,
    },

    shippingName: {
      type: String,
      required: [true, "Shipping name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    shippingPhone: {
      type: String,
      required: [true, "Shipping phone is required"],
      trim: true,
      validate: {
        validator: function (v) {
          // BD phone validation (starts with 01 and has 11 digits)
          return /^01[0-9]{9}$/.test(v);
        },
        message: "Invalid Bangladeshi phone number",
      },
    },

    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
      minlength: [10, "Address must be at least 10 characters"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    trackingNumber: {
      type: String,
      trim: true,
      default: null,
      maxlength: [100, "Tracking ID too long"],
    },

    courier: {
      type: String,
      trim: true,
      default: null,
      maxlength: [100, "Courier name too long"],
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, "Admin note cannot exceed 500 characters"],
      default: "",
    },

    claimedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RewardClaim", rewardClaimSchema);
