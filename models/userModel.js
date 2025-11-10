const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [30, "First name cannot exceed 30 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [30, "Last name cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin approval required
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Admin is a user with role='admin'
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    isRejected: {
      type: Boolean,
      default: false, 
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    isVendor: {
      type: Boolean,
      default: false, // 🔹 অ্যাডমিন এপ্রুভ না করা পর্যন্ত false
    },
    vendorAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected", "banned"],
      default: "pending",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^01[3-9]\d{8}$/.test(v); // Bangladeshi phone format
        },
        message: "Please provide a valid Bangladeshi phone number",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [16, "Password must be less than 16 characters"],
      select: false,
    },

    image: {
      type: String,
      required: [true, "Image is required"],     
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      required: [true, "Referral code is required"],
      uppercase: true,
      default: null,
      trim: true,
    },
    referredBy: {
      type: String,
      required: [true, "Referral code is required"],
      default: null,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    placementPosition: { 
      type: String, 
      enum: ["line one", "line two", "line three"], 
      default: null 
    },
    childIndex: { 
      type: Number, 
      min: 0, 
      max: 2, 
      default: null 
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 17,
    },
    referralLocked: { 
      type: Boolean, 
      default: false, 
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDepositPaid: {
      type: Boolean,
      default: false,
    },
    depositAmount: { 
      type: Number,
      default: 20,
    },
    depositTransactionId: {
      type: String,
      required: [true, "Transaction Id is required"],
      trim: true,
    },

    // ✅ Nominee Section
    nominee: {
      firstName: {
        type: String,
        required: [true, "Nominee first name is required"],
        trim: true,
        minlength: [3, "Nominee name must be at least 3 characters"],
        maxlength: [50, "Nominee name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        required: [true, "Nominee last name is required"],
        trim: true,
        minlength: [3, "Nominee name must be at least 3 characters"],
        maxlength: [50, "Nominee name cannot exceed 50 characters"],
      },
      relation: {
        type: String,
        required: [true, "Relation to nominee is required"],
        enum: ["Father", "Mother", "Brother", "Sister", "Spouse", "Child", "Relative", "Other"],
      },
      phone: {
        type: String,
        required: [true, "Nominee phone is required"],
        trim: true,
        validate: {
          validator: function (v) {
            return /^01[3-9]\d{8}$/.test(v);
          },
          message: "Please provide a valid Bangladeshi phone number for nominee",
        },
      },
      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
      },
    },
  },
  { timestamps: true }
);


// Prevent more than 3 children
userSchema.pre("save", function (next) {
  if (this.children.length > 3) {
    return next(new Error("A user can have a maximum of 3 children"));
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
