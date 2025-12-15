const AgentStock = require("../../models/agent/agentStockModel");

const getMyAgentStock = async (req, res) => {
  try {
    const agentId = req.userid; // Logged In Agent ID

    // Agent not found / not logged in
    if (!agentId) {
      return res.status(401).json({ msg: "Unauthorized!" });
    }

    // Find agent's stock
    const stock = await AgentStock.findOne({ agentId })
  .populate("products.productId", "name price image description costPrice category brand discount");


    if (!stock) {
      return res.json({
        msg: "No stock found!",
        products: [],
      });
    }

    return res.json({
      msg: "Stock loaded",
      agentId: stock.agentId,
      products: stock.products.map(p => ({
        productId: p.productId._id,
        name: p.productId.name,
        price: p.productId.price,
        image: p.productId.image,
        description: p.productId.description,
        costPrice: p.productId.costPrice,
        category: p.productId.category,
        brand: p.productId.brand,
        discount: p.productId.discount,
        qty: p.qty,
        joining_quantity: p.joining_quantity,
      })),
    });

  } catch (error) {
    return res.status(500).json({
      msg: "Server error",
      error: error.message
    });
  }
};

module.exports = { getMyAgentStock };
