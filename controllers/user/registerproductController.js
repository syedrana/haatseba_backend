const AgentStock = require("../../models/agent/agentStockModel");

const registerProduct = async (req, res) => {
  try {
    const agentId = req.userid;
    const { query = "" } = req.query;

    const stock = await AgentStock.findOne({ agentId })
      .populate({
        path: "products.productId",
        match: {
          name: { $regex: query, $options: "i" },
        },
        select: "name image price",
      });

    if (!stock || !stock.products.length) {
      return res.json({ products: [] });
    }

    const products = stock.products
      .filter((p) => p.productId) // unmatched populate remove
      .map((p) => ({
        productId: p.productId._id,
        name: p.productId.name,
        image: p.productId.image,
        price: p.productId.price,
        qty: p.qty,
        joining_quantity: p.joining_quantity,
      }));

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
};

module.exports = { registerProduct };
