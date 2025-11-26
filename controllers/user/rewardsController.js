const Bonus = require("../../models/bonusModel");

// -------------- User APIs ----------------

const getMyRewards = async (req, res) => {
  try {
    const userId = req.userid; // middleware sets
    const bonuses = await Bonus.find({ userId }).sort({ createdAt: -1 });
    return res.json(bonuses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch bonuses" });
  }
};

// POST /rewards/claim  -> user claims a product bonus
/*
body: { bonusId, shippingName, shippingPhone, shippingAddress }
*/
const claimReward = async (req, res) => {
  try {
    const userId = req.userid;
    const { bonusId, shippingName, shippingPhone, shippingAddress } = req.body;

    const bonus = await Bonus.findById(bonusId);
    if (!bonus) return res.status(404).json({ message: "Bonus not found" });
    if (String(bonus.userId) !== String(userId)) return res.status(403).json({ message: "Not your bonus" });
    if (bonus.rewardType !== "product") return res.status(400).json({ message: "Only product bonuses require a claim" });
    if (bonus.status !== "approved") return res.status(400).json({ message: "Bonus not available for claim" });

    // Prevent duplicate claims
    const existing = await RewardClaim.findOne({ bonusId, userId, status: { $ne: "cancelled" } });
    if (existing) return res.status(400).json({ message: "You already claimed this reward" });

    const claim = await RewardClaim.create({
      bonusId,
      userId,
      shippingName,
      shippingPhone,
      shippingAddress,
    });

    // optionally mark bonus as 'processing' to prevent re-claims
    bonus.status = "processing";
    await bonus.save();

    return res.status(201).json({ message: "Claim submitted", claim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Claim failed" });
  }
};

// GET /rewards/claim/:id  -> view a single claim
const getMyClaim = async (req, res) => {
  try {
    const claim = await RewardClaim.findById(req.params.id).populate("bonusId");
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (String(claim.userId) !== String(req.userid)) return res.status(403).json({ message: "Not authorized" });
    return res.json(claim);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed" });
  }
};


// ---------------- Admin APIs ------------------

// GET /admin/rewards/claims  -> list all claims (with filter)
const adminListClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const claims = await RewardClaim.find(filter).populate("userId", "firstName lastName phone email").populate("bonusId").sort({ createdAt: -1 });
    return res.json(claims);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load claims" });
  }
};

// PATCH /admin/rewards/claim/:id  -> update claim status (processing/shipped/delivered/rejected/cancelled)
const adminUpdateClaim = async (req, res) => {
  try {
    const id = req.params.id;
    const { status, trackingNumber, courier, adminNote } = req.body;
    const claim = await RewardClaim.findById(id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Update fields
    if (status) claim.status = status;
    if (trackingNumber) claim.trackingNumber = trackingNumber;
    if (courier) claim.courier = courier;
    if (adminNote) claim.adminNote = adminNote;

    // set processing/delivered timestamps
    if (status === "processing") claim.processedAt = new Date();
    if (status === "delivered") {
      claim.deliveredAt = new Date();
      // also mark underlying bonus delivered
      const bonus = await Bonus.findById(claim.bonusId);
      if (bonus) {
        bonus.status = "delivered";
        await bonus.save();
        // optionally decrement product stock
        if (bonus.productId) {
          await Product.findByIdAndUpdate(bonus.productId, { $inc: { stock: -1 } });
        }
      }
    }

    await claim.save();
    return res.json({ message: "Claim updated", claim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Update failed" });
  }
};

// Admin endpoint to issue a bonus manually (or call issueBonus from other code)
const adminIssueBonus = async (req, res) => {
  try {
    const { userId, level, rewardType, bonusAmount, productId } = req.body;
    const adminId = req.userid; // must be admin
    const bonus = await issueBonus({ userId, level, rewardType, bonusAmount, productId, issuedBy: adminId });
    return res.status(201).json({ message: "Bonus issued", bonus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Issue failed" });
  }
};

// Admin: list all bonuses (optional)
const adminListBonuses = async (req, res) => {
  try {
    const bonuses = await Bonus.find().populate("userId", "firstName lastName email").populate("productId", "name").sort({ createdAt: -1 });
    return res.json(bonuses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch bonuses" });
  }
};


module.exports = { getMyRewards };