// controllers/adminBonusController.js
const mongoose = require("mongoose");
const Bonus = require("../../models/bonusModel");
const Wallet = require("../../models/walletModel");
//const Product = require("../../models/productModel");
//const RewardClaim = require("../models/rewardClaimModel");
const User = require("../../models/userModel");

// GET /admin/bonuses/pending
const listPendingBonuses = async (req, res) => {
  try {
    const pending = await Bonus.find({ status: "pending" })
      .populate("userId", "firstName lastName phone email")
      .sort({ createdAt: -1 });
    return res.json({ bonuses: pending });
  } catch (err) {
    console.error("listPendingBonuses:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /admin/bonuses (all with filters)
const listAllBonuses = async (req, res) => {
  try {
    const { status, rewardType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (rewardType) filter.rewardType = rewardType;

    const skip = (Number(page) - 1) * Number(limit);
    const bonuses = await Bonus.find(filter)
      .populate("userId", "firstName lastName phone email")
      //.populate("productId", "name currentPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Bonus.countDocuments(filter);
    return res.json({ bonuses, total });
  } catch (err) {
    console.error("listAllBonuses:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const listApprovedBonuses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const bonuses = await Bonus.find({ status: "approved" })
      .populate("userId", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Bonus.countDocuments({ status: "approved" });

    return res.json({
      bonuses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to load approved bonuses" });
  }
};

// PATCH /admin/bonus/approve/:id
// Approve a pending bonus
const approveBonus = async (req, res) => {
  const bonusId = req.params.id;
  const adminId = req.userid; // assume admin middleware sets
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const bonus = await Bonus.findById(bonusId).session(session);
    if (!bonus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bonus not found" });
    }
    if (bonus.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Bonus is not pending" });
    }

    // update status to approved
    bonus.status = "approved";
    bonus.issuedBy = adminId;
    await bonus.save({ session });

    // If rewardType === 'cash' we may optionally credit wallet immediately OR wait for 'markPaid'
    // Here we do NOT auto-credit — we leave it to markPaid endpoint (two-step workflow).
    // (If you want one-step credit, uncomment the code below.)

    await session.commitTransaction();
    session.endSession();
    return res.json({ message: "Bonus approved", bonus });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("approveBonus:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /admin/bonus/reject/:id
// Reject pending bonus (add note)
const rejectBonus = async (req, res) => {
  const bonusId = req.params.id;
  const { note } = req.body;
  try {
    const bonus = await Bonus.findById(bonusId);
    if (!bonus) return res.status(404).json({ message: "Bonus not found" });
    if (bonus.status !== "pending") return res.status(400).json({ message: "Only pending bonuses can be rejected" });

    bonus.status = "rejected";
    if (note) bonus.note = note;
    await bonus.save();

    return res.json({ message: "Bonus rejected", bonus });
  } catch (err) {
    console.error("rejectBonus:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /admin/bonus/mark-paid/:id
// Mark approved bonus as paid (this will credit wallet for cash, decrement stock for product, finalize)
const markPaid = async (req, res) => {
  const bonusId = req.params.id;
  const adminId = req.userid;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const bonus = await Bonus.findById(bonusId).session(session);
    if (!bonus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bonus not found" });
    }

    if (bonus.status === "paid") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Bonus already paid" });
    }

    // if (bonus.status !== "approved") {
    //   await session.abortTransaction();
    //   return res.status(400).json({ message: "Only approved bonuses can be marked paid" });
    // }

    // CASH
    if (bonus.rewardType === "cash") {
      const amount = Number(bonus.costValue || bonus.bonusAmount || 0);

      const transactionLog = { item: `Cash Bonus ৳${amount}`, date: new Date() };

      // credit wallet
      const wallet = await Wallet.findOneAndUpdate(
        { userId: bonus.userId },
        { 
          $inc: { cashBalance: amount },
          $push: { rewards: transactionLog }, 
        },
        { upsert: true, new: true, session }
      );

      // Check if wallet update succeeded
      if (!wallet) {
          throw new Error("Failed to update or create wallet.");
      }

      bonus.status = "paid";
      await bonus.save({ session });

      // optional: create wallet transaction log model if you have one

    } else if (bonus.rewardType === "product") {

      const nonCashItem = bonus.bonusAmount;

      // await Wallet.findOneAndUpdate(
      //   { userId: bonus.userId },
      //   { $push: { rewards: { item: `Reward: ${nonCashItem}`, date: new Date(), bonusRef: bonus._id } } },
      //   { upsert: true, new: false, session } // upsert:true to create wallet if not exists
      // );
      
      // Mark paid — (you might prefer to wait until delivered; here paid means reserved & stock decremented)
      bonus.status = "completed";
      await bonus.save({ session });
    } else if (bonus.rewardType === "none") {
      // other types (mobile etc.) — you can treat as paid once manual processing done
      bonus.status = "not_applicable";
      await bonus.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.json({ message: "Bonus marked paid", bonus });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("markPaid:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const approveMobileRecharge = async (req, res) => {
  try {
    const bonusId = req.params.id;

    const bonus = await Bonus.findById(bonusId).populate("userId");
    if (!bonus)
      return res.status(404).json({ message: "Bonus not found" });

    // Must be mobile recharge
    if (bonus.rewardType !== "mobile_recharge")
      return res.status(400).json({ message: "Not a mobile recharge bonus" });

    // Already done
    if (bonus.status === "paid")
      return res.status(400).json({ message: "Recharge already completed" });

    // Set recharge done
    bonus.status = "paid";
    bonus.rechargeNumber = bonus.userId.phone;  // Auto bind user phone
    bonus.rechargedAt = new Date();

    if (req.body.transactionId) bonus.transactionId = req.body.transactionId;
    if (req.body.adminNote) bonus.adminNote = req.body.adminNote;

    await bonus.save();

    res.json({
      success: true,
      message: "Mobile Recharge Completed Successfully",
      bonus
    });

  } catch (error) {
    console.log("Recharge Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  listPendingBonuses,
  listAllBonuses,
  listApprovedBonuses,
  approveBonus,
  rejectBonus,
  markPaid,
  approveMobileRecharge,
};
