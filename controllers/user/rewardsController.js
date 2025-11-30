const Bonus = require("../../models/bonusModel");
const RewardClaim = require("../../models/rewardclaimModel");
const mongoose = require("mongoose");

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userid;
    const { bonusId, shippingName, shippingPhone, shippingAddress } = req.body;

    if (!shippingName || !shippingPhone || !shippingAddress) {
      await session.abortTransaction();
      return res.status(400).json({ message: "All shipping fields are required" });
    }

    // Fetch bonus inside transaction
    const bonus = await Bonus.findById(bonusId).session(session);
    if (!bonus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bonus not found" });
    }

    if (String(bonus.userId) !== String(userId)) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not your bonus" });
    }

    if (bonus.rewardType !== "product") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Only product bonuses require a claim" });
    }

    if (bonus.status !== "approved") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Bonus not available for claim" });
    }

    // Prevent duplicate claim
    const existing = await RewardClaim.findOne({
      bonusId,
      userId,
      status: { $ne: "cancelled" }
    }).session(session);

    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ message: "You already claimed this reward" });
    }

    // Create claim inside transaction
    const claim = await RewardClaim.create(
      [
        {
          bonusId,
          userId,
          shippingName,
          shippingPhone,
          shippingAddress
        }
      ],
      { session }
    );

    // Update bonus status inside transaction
    bonus.status = "processing";
    await bonus.save({ session });

    // Everything successful → commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: "Claim submitted", claim: claim[0] });

  } catch (err) {
    console.error("Claim Reward Error:", err);

    await session.abortTransaction();
    session.endSession();

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors,
      });
    }

    return res.status(500).json({ message: "Claim failed" });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const userId = req.userid;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const claims = await RewardClaim.find({ userId })
      .populate("bonusId", "level bonusAmount rewardType")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await RewardClaim.countDocuments({ userId });

    return res.status(200).json({ success: true, claims, total });
  } catch (err) {
    console.error("getMyClaims error:", err);
    return res.status(500).json({ message: "Failed to fetch claims" });
  }
};

// GET /myclaims/:id -> single claim for user
const getMyClaimById = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;

    const claim = await RewardClaim.findById(id)
      .populate("bonusId", "level bonusAmount rewardType")
      .populate("userId", "firstName lastName email phone image");

    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (String(claim.userId._id) !== String(userId)) return res.status(403).json({ message: "Not your claim" });

    return res.status(200).json({ success: true, data: claim });
  } catch (err) {
    console.error("getMyClaimById error:", err);
    return res.status(500).json({ message: "Failed to fetch claim" });
  }
};

// PUT /myclaims/cancel/:id -> user cancels own claim (only if allowed)
const cancelMyClaim = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.userid;
    const { id } = req.params;
    const { adminNote } = req.body;

    const claim = await RewardClaim.findById(id).session(session);
    if (!claim) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Claim not found" });
    }
    if (String(claim.userId) !== String(userId)) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not your claim" });
    }

    // Only allow cancel in these statuses (business rule)
    if (!["pending", "processing"].includes(claim.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cannot cancel at this stage" });
    }

    // set claim cancelled
    claim.status = "cancelled";
    claim.adminNote = adminNote || `${userId} cancelled`;
    await claim.save({ session });

    // revert bonus status to approved (if bonus exists)
    const bonus = await Bonus.findById(claim.bonusId).session(session);
    if (bonus) {
      bonus.status = "approved";
      await bonus.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: "Claim cancelled", claim });
  } catch (err) {
    console.error("cancelMyClaim error:", err);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Failed to cancel claim" });
  }
};



module.exports = { getMyRewards, claimReward, getMyClaims, getMyClaimById, cancelMyClaim, };