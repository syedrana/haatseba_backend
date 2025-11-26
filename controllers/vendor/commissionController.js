const mongoose = require("mongoose");
const Commission = require("../../models/vendor/commissionModel");
const CommissionHistory = require("../../models/vendor/commissionHistoryModel");
const Category = require("../../models/vendor/categoryModel");
const Vendor = require("../../models/vendor/vendorRequestModel");

// 🟢 Create or Update Commission (with History)
const setCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { categoryId, vendorId, rate, note } = req.body;
    const adminId = req.userid;

    // 🧩 Input Validation
    if (!categoryId || rate == null)
      return res.status(400).json({ success: false, message: "Category ID and rate are required" });

    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return res.status(400).json({ success: false, message: "Invalid category ID" });

    if (vendorId && !mongoose.Types.ObjectId.isValid(vendorId))
      return res.status(400).json({ success: false, message: "Invalid vendor ID" });

    if (rate < 0 || rate > 100)
      return res.status(400).json({ success: false, message: "Rate must be between 0 and 100" });

    // 🧾 Check category exists
    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    // 🧾 If vendor specified, verify vendor is approved
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor || vendor.status !== "approved")
        return res.status(400).json({ success: false, message: "Vendor not approved or not found" });
    }

    // 🔍 Find existing commission
    let commission = await Commission.findOne({
      category: categoryId,
      vendor: vendorId || null,
    }).session(session);

    const oldRate = commission ? commission.rate : null;

    // ✍️ Update or Create
    if (commission) {
      commission.rate = rate;
      commission.updatedBy = adminId;
      await commission.save({ session });
    } else {
      commission = await Commission.create(
        [
          {
            category: categoryId,
            vendor: vendorId || null,
            rate,
            updatedBy: adminId,
          },
        ],
        { session }
      );
      commission = commission[0];
    }

    // 🧾 Save to History
    await CommissionHistory.create(
      [
        {
          commission: commission._id,
          category: categoryId,
          vendor: vendorId || null,
          oldRate,
          newRate: rate,
          changedBy: adminId,
          note: note || "Commission updated",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Commission rate updated and history saved",
      commission,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟣 Get Commission Rate
const getCommission = async (req, res) => {
  try {
    const { categoryId, vendorId } = req.query;

    let commission = await Commission.findOne({
      category: categoryId,
      vendor: vendorId || null,
      status: "active",
    });

    if (!commission && vendorId) {
      commission = await Commission.findOne({
        category: categoryId,
        vendor: null,
        status: "active",
      });
    }

    if (!commission)
      return res.status(404).json({
        success: false,
        message: "No commission found for this category/vendor",
      });

    res.status(200).json({
      success: true,
      rate: commission.rate,
      type: commission.vendor ? "vendor-specific" : "category-default",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟡 Get Commission History
const getCommissionHistory = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const history = await CommissionHistory.find({ commission: commissionId })
      .populate("changedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { setCommission, getCommission, getCommissionHistory };
