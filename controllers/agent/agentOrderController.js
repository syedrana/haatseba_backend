const AgentOrder = require("../../models/agent/agentOrderModel");
const AgentStock = require("../../models/agent/agentStockModel");
const Package = require("../../models/agent/packageModel");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const Product = require("../../models/vendor/vendorproductModel");

// ✅ User places agent package order
const placeAgentOrder = async (req, res) => {
  try {
    const userId = req.userid; // Logged in user
    const { packageId, quantity, paymentType } = req.body;

    // 1️⃣ Validate package
    const package = await Package.findById(packageId);
    if (!package || package.status !== "active") {
      return res.status(400).json({ success: false, message: "Invalid package" });
    }

    if (package.stock < quantity) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }

    const amount = package.price * quantity;

    // 2️⃣ Create order
    const order = await AgentOrder.create({
      userId,
      packageId,
      quantity,
      paymentType,
      amount,
      status: "pending",
    });

    res.json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /admin/agent-orders
 * Query: status, q (search by user/email/package name), page, limit
 */
const listAgentOrders = async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const perPage = Math.max(1, parseInt(limit));

    const filter = {};
    if (status) filter.status = status;

    if (q) {
      // search user name/email or package name
      const regex = new RegExp(q.trim(), "i");
      // use $or with populated fields via aggregation or pre-populate by lookup
      // We will filter by user name/email or package name using aggregation for accurate results:
      const agg = [
        { $match: filter },
        // join user
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        // join package
        {
          $lookup: {
            from: "packages",
            localField: "packageId",
            foreignField: "_id",
            as: "package",
          },
        },
        { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "user.firstName": regex },
              { "user.lastName": regex },
              { "user.email": regex },
              { "package.name": regex },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (pageNum - 1) * perPage },
        { $limit: perPage },
        // project desired fields
        {
          $project: {
            user: { _id: 1, firstName: 1, lastName: 1, email: 1 },
            package: { _id: 1, name: 1, price: 1 },
            quantity: 1,
            amount: 1,
            status: 1,
            paymentType: 1,
            createdAt: 1,
            approvedBy: 1,
            approvedAt: 1,
          },
        },
      ];

      const results = await AgentOrder.aggregate(agg);
      // count separately with similar filter + search
      const countAgg = [
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "packages",
            localField: "packageId",
            foreignField: "_id",
            as: "package",
          },
        },
        { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "user.firstName": regex },
              { "user.lastName": regex },
              { "user.email": regex },
              { "package.name": regex },
            ],
          },
        },
        { $count: "total" },
      ];
      const cntRes = await AgentOrder.aggregate(countAgg);
      const total = cntRes[0]?.total || 0;

      return res.json({ success: true, orders: results, total });
    }

    // No search query - simple find with populate
    const [orders, total] = await Promise.all([
      AgentOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate("userId", "firstName lastName email")
        .populate("packageId", "name price"),
      AgentOrder.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total });
  } catch (err) {
    console.error("listAgentOrders:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /admin/agent-orders/:id
 * Returns full order details (populate user, package)
 */
const getAgentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await AgentOrder.findById(id)
      .populate("userId", "firstName lastName email phone role")
      .populate({
        path: "packageId",
        select: "name price products image stock",
        populate: {
          path: "products.productId",
          select: "name sku",
        },
      })
      .populate("approvedBy", "firstName lastName email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    console.error("getAgentOrder:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /admin/agent-orders/:id/approve
 * Approve order -> set status, approvedBy, approvedAt
 * Also decrement package stock (transactionally)
 */
const approveAgentOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.userid;

    // 1) Find order
    const order = await AgentOrder.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ msg: "Order not found!" });
    }

    if (order.status === "approved") {
      await session.abortTransaction();
      return res.status(400).json({ msg: "Order already approved!" });
    }

    // 2) Load package with products
    const pkg = await Package.findById(order.packageId)
      .populate("products.productId")
      .session(session);

    if (!pkg) {
      await session.abortTransaction();
      return res.status(400).json({ msg: "Package not found!" });
    }

    // 3) Convert package products to items array
    const items = pkg.products.map(p => ({
      productId: p.productId._id,
      qty: p.quantity * order.quantity, // if order quantity > 1
      joining_quantity: (p.joining_quantity != null) ? p.joining_quantity : 0,
      joining_stock: (p.joining_stock != null) ? p.joining_stock : 0
    }));

    // 4) Stock check
    for (let item of items) {
      const p = await Product.findById(item.productId).session(session);
      
      if (!p) {
        await session.abortTransaction();
        return res.status(400).json({ msg: "Product not found!" });
      }

      if (p.stock < item.qty) {
        await session.abortTransaction();
        return res.status(400).json({
          msg: `Insufficient stock for ${p.name}. Available: ${p.stock}`
        });
      }
    }

    // 5) Deduct product stock
    for (let item of items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.qty } },
        { session }
      );
    }

    // 6) Agent stock update
    // 5) Agent stock update (Clean & Correct Way)
    for (let item of items) {

      // --- Step A: Ensure agent stock document exists ---
      let agentStock = await AgentStock.findOne({ agentId: order.userId }).session(session);

      if (!agentStock) {
        agentStock = new AgentStock({
          agentId: order.userId,
          products: []
        });
        await agentStock.save({ session });
      }

      // --- Step B: Check if product already exists for this agent ---
      const existing = agentStock.products.find(
        p => p.productId.toString() === item.productId.toString()
      );

      if (existing) {
        // Increase qty
        existing.qty += item.qty;
        existing.joining_quantity = item.joining_quantity || 0;
      } else {
        // Add new product entry
        agentStock.products.push({
          productId: item.productId,
          qty: item.qty,
          joining_quantity: item.joining_quantity || 0,
        });
      }

      await agentStock.save({ session });
    }


    // 7) Make user agent (only if not agent already)
    await User.updateOne(
      { _id: order.userId, isAgent: false },
      {
        $set: {
          isAgent: true,
          agentSince: new Date()
        }
      },
      { session }
    );

    // 8) Update order
    order.status = "approved";
    order.approvedBy = adminId;
    order.approvedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ msg: "Order approved successfully!" });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({ msg: "Server error!", error: err.message });
  }
};




/**
 * POST /admin/agent-orders/:id/reject
 * Reject order -> set status=rejected, optionally store reason
 */
const rejectAgentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const adminId = req.userid;

    const order = await AgentOrder.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status === "approved") return res.status(400).json({ success: false, message: "Already approved" });
    if (order.status === "rejected") return res.status(400).json({ success: false, message: "Already rejected" });

    order.status = "rejected";
    order.approvedBy = adminId;
    order.approvedAt = new Date();
    order.rejectionReason = reason || "";
    await order.save();

    // Note: you may optionally restock package or notify user here

    res.json({ success: true, message: "Order rejected", order });
  } catch (err) {
    console.error("rejectAgentOrder:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = { 
  placeAgentOrder,
  listAgentOrders,
  getAgentOrder,
  approveAgentOrder,
  rejectAgentOrder, 
};
