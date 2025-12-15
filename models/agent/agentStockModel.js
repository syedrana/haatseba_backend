const mongoose = require("mongoose");

// ------------------------------
// Agent Stock Schema
// ------------------------------
const agentStockSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        qty: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },

        joining_quantity: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Duplicate protector
agentStockSchema.pre("save", function (next) {
  const seen = new Set();
  for (let item of this.products) {
    const pid = item.productId.toString();
    if (seen.has(pid)) return next(new Error("Duplicate product not allowed"));
    seen.add(pid);
  }
  next();
});

module.exports = mongoose.model("AgentStock", agentStockSchema);
