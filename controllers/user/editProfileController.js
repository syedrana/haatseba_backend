const User = require("../../models/userModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");


    // User Side

const getMe = async (req, res) => {
  try {
    const userId = req.userid; // checklogin middleware থেকে আসছে

    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};


const requestProfileUpdate = async (req, res) => {
  try {
    const userId = req.userid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.pendingProfileUpdate?.status === "pending") {
      return res.status(400).json({
        message: "Your profile update request is already pending approval",
      });
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "address",
      "image",
      "nominee",
    ];

    const filteredData = {};

    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        filteredData[f] = req.body[f];
      }
    });

    // ✅ nominee sanitize
    if (req.body.nominee) {
      const n = req.body.nominee;
      filteredData.nominee = {
        firstName: n.firstName || user.nominee?.firstName || "",
        lastName: n.lastName || user.nominee?.lastName || "",
        relation: n.relation || user.nominee?.relation || "",
        phone: n.phone || user.nominee?.phone || "",
        address: n.address || user.nominee?.address || "",
      };
    }



    if (req.file) {
      // Delete old image
      // if (user.imagePublicId) {
      //   await cloudinary.uploader.destroy(user.imagePublicId);
      // }

      // Upload new image
      const imageResult = await uploadToCloudinary(req.file.buffer);
      filteredData.image = imageResult.secure_url;
      filteredData.imagePublicId = imageResult.public_id;
    }

    user.pendingProfileUpdate = {
      data: filteredData,
      status: "pending",
      requestedAt: new Date(),
    };

    await user.save();

    res.json({
      success: true,
      message: "Profile update request submitted for admin approval",
    });
  } catch (err) {
    console.error("REQUEST PROFILE UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit profile update request",
    });
  }
};



// Admin Panel

const getPendingProfileUpdates = async (req, res) => {
  const users = await User.find({
    "pendingProfileUpdate.status": "pending",
  }).select(
    "firstName lastName email phone address image nominee pendingProfileUpdate"
  );

  res.json({
    success: true,
    users,
  });
};

const approveProfileUpdate = async (req, res) => {
  const adminId = req.userid;
  const { id } = req.params;

  if (req.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const user = await User.findById(id);
  if (!user || user.pendingProfileUpdate?.status !== "pending") {
    return res.status(400).json({ message: "No pending request found" });
  }

  const pendingData = user.pendingProfileUpdate.data;

  // 🗑️ Delete OLD image AFTER approval
  if (
    pendingData.imagePublicId &&
    user.imagePublicId &&
    pendingData.imagePublicId !== user.imagePublicId
  ) {
    await cloudinary.uploader.destroy(user.imagePublicId);
  }

  // 1️⃣ Apply changes to main profile
  Object.assign(user, pendingData);

  // 2️⃣ Record approval metadata BEFORE clearing data
  user.pendingProfileUpdate.status = "approved";
  user.pendingProfileUpdate.reviewedAt = new Date();
  user.pendingProfileUpdate.reviewedBy = adminId;

  // 3️⃣ Save
  await user.save();

  // 4️⃣ Remove pendingProfileUpdate after save (optional)
  user.pendingProfileUpdate = null;
  await user.save();

  res.json({
    success: true,
    message: "Profile update approved successfully",
  });
};



const rejectProfileUpdate = async (req, res) => {
  const adminId = req.userid;
  const { id } = req.params;
  const { reason } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const user = await User.findById(id);

  if (!user || user.pendingProfileUpdate?.status !== "pending") {
    return res.status(400).json({ message: "No pending request found" });
  }

  const pendingData = user.pendingProfileUpdate.data;

  // 🗑️ Delete NEW uploaded image
  if (pendingData.imagePublicId) {
    await cloudinary.uploader.destroy(pendingData.imagePublicId);
  }

  user.pendingProfileUpdate = {
    status: "rejected",
    rejectReason: reason,
    reviewedAt: new Date(),
    reviewedBy: adminId,
  };


  await user.save();

  res.json({
    success: true,
    message: "Profile update rejected",
  });
};



module.exports = {
    getMe,
    requestProfileUpdate,
    getPendingProfileUpdates,
    approveProfileUpdate,
    rejectProfileUpdate,
};