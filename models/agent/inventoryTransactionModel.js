const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  from: { type: String, enum: ["admin", "agent"], required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },

  transactionType: { 
    type: String, 
    enum: ["admin_to_agent", "agent_to_customer"],
    required: true
  },

  amount: { type: Number, required: true }, // টাকার পরিমাণ
  paymentMethod: { type: String, default: "cash" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InventoryTransaction", inventorySchema);
