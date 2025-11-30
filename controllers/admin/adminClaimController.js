const RewardClaim = require("../../models/rewardclaimModel");
const Bonus = require("../../models/bonusModel");
const User = require("../../models/userModel");

// ===============================
// 📌 GET ALL CLAIMS (Admin Panel)
// ===============================
const getAllClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const claims = await RewardClaim.find(filter)
      .populate("userId", "firstName lastName phone email image")
      .populate("bonusId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await RewardClaim.countDocuments(filter);

    return res.status(200).json({ claims, total });
  } catch (err) {
    console.error("Get Claims Error:", err);
    return res.status(500).json({ message: "Failed to fetch claims" });
  }
};

// ===============================
// 📌 GET SINGLE CLAIMS (Admin Panel)
// ===============================
const getSingleClaim = async (req, res) => {
  try {
    const claimId = req.params.id;
    console.log("🔎 Claim ID from frontend:", req.params.id);

    const claim = await RewardClaim.findById(claimId)
      .populate("userId", "firstName lastName email phone image userId")   // ইউজারের ডিটেইল
      .populate("bonusId", "level bonusAmount rewardType");  // বোনাস ডিটেইল

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(200).json({
      success: true,
      data: claim,
    });

  } catch (error) {
    console.error("Error fetching claim:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


// ===============================
// 📌 ADMIN: APPROVE CLAIM
// ===============================
const approveClaim = async (req, res) => {
  try {
    const claimId  = req.params.id;

    const claim = await RewardClaim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "processing";
    claim.processedAt = new Date();
    await claim.save();

    // Update bonus too
    await Bonus.findByIdAndUpdate(claim.bonusId, { status: "processing" });

    res.status(200).json({ message: "Claim approved", claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approve failed" });
  }
};

// ===============================
// 📌 ADMIN: REJECT CLAIM
// ===============================
const rejectClaim = async (req, res) => {
  try {
    const claimId  = req.params.id;
    const { adminNote } = req.body;

    const claim = await RewardClaim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "rejected";
    claim.adminNote = adminNote || "Rejected";
    await claim.save();

    // Bonus back to approved
    await Bonus.findByIdAndUpdate(claim.bonusId, { status: "approved" });

    res.status(200).json({ message: "Claim rejected", claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reject failed" });
  }
};

// ===============================
// 📌 ADMIN: MARK AS SHIPPED
// ===============================
const markShipped = async (req, res) => {
  try {
    const claimId  = req.params.id;
    const { trackingNumber, courier } = req.body;

    const claim = await RewardClaim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "shipped";
    claim.trackingNumber = trackingNumber;
    claim.courier = courier;
    await claim.save();

    await Bonus.findByIdAndUpdate(claim.bonusId, { status: "shipped" });

    res.status(200).json({ message: "Marked as shipped", claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ship update failed" });
  }
};

// ===============================
// 📌 ADMIN: MARK AS DELIVERED
// ===============================
const markDelivered = async (req, res) => {
  try {
    const claimId  = req.params.id;

    const claim = await RewardClaim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "delivered";
    claim.deliveredAt = new Date();
    await claim.save();

    await Bonus.findByIdAndUpdate(claim.bonusId, { status: "completed" });

    res.status(200).json({ message: "Marked as delivered", claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delivery update failed" });
  }
};

// ===============================
// 📌 ADMIN: CANCEL CLAIM
// ===============================
const cancelClaim = async (req, res) => {
  try {
    const claimId  = req.params.id;
    const { adminNote } = req.body;

    const claim = await RewardClaim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "cancelled";
    claim.adminNote = adminNote || "Cancelled";
    await claim.save();

    // Bonus re-opened
    await Bonus.findByIdAndUpdate(claim.bonusId, { status: "approved" });

    res.status(200).json({ message: "Claim cancelled", claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancel failed" });
  }
};

module.exports = { 
    getAllClaims,
    getSingleClaim,
    approveClaim,
    rejectClaim,
    markShipped,
    markDelivered,
    cancelClaim, 
};