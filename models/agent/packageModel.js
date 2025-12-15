const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // মোট কয়টি প্রোডাক্ট
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // রেজিস্ট্রেশনে কয়টি লাগবে
        joining_quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // Auto Calculate
        joining_stock: {
          type: Number,
          default: 0,
        },
      },
    ],

    totalUnits: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


// 🔥 Auto Calculate totalUnits + joining_stock
packageSchema.pre("save", function (next) {

  let totalUnits = 0;

  this.products.forEach((p) => {
    totalUnits += p.quantity;

    // joining_stock = quantity / joining_quantity
    p.joining_stock = Math.floor(p.quantity / p.joining_quantity);
  });

  this.totalUnits = totalUnits;

  next();
});

module.exports = mongoose.model("Package", packageSchema);
