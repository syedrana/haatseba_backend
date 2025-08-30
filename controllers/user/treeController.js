const { image } = require("../../config/cloudinary");
const User = require("../../models/userModel");

// ✅ Downline Tree API
const getDownlineTree = async (req, res) => {
  try {
    const userId = req.userid; // যে ইউজারের tree দেখতে চাই

    // --- Root User
    const rootUser = await User.findById(userId).select("firstName lastName email phone image referralCode level children");

    if (!rootUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Recursive tree build
    const tree = await buildTree(userId, 1, 17); // 17 levels পর্যন্ত

    res.status(200).json({
      userId: rootUser._id,
      name: rootUser.firstName,
      email: rootUser.email,
      phone: rootUser.phone,
      image: rootUser.image,
      referralCode: rootUser.referralCode,
      level: rootUser.level,
      tree,
    });

  } catch (error) {
    console.error("Tree Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};


// 🔁 Recursive function
async function buildTree(userId, currentLevel, maxLevel) {
  if (currentLevel > maxLevel) return [];

  const user = await User.findById(userId).select("children");

  if (!user || user.children.length === 0) {
    return [];
  }

  const childrenData = await Promise.all(
  user.children.map(async (childId) => {
    const child = await User.findById(childId).select("firstName lastName email phone image referralCode level children");
    if (!child) return null; // safety check

    return {
      userId: child._id,
      name: `${child.firstName} ${child.lastName}`, // ✅ fixed
      email: child.email,
      phone: child.phone,
      image: child.image,
      referralCode: child.referralCode,
      level: child.level,
      children: await buildTree(child._id, currentLevel + 1, maxLevel),
    };
  })
);

// null গুলো বাদ দিয়ে clean result ফেরত দাও
return childrenData.filter(Boolean);

}

module.exports = { getDownlineTree };
