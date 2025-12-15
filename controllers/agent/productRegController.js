const User = require("../../models/userModel");
const Product = require("../../models/vendor/vendorproductModel");
const AgentStock = require("../../models/agent/agentStockModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
const generateUniqueReferralCode = require("../../utils/generateReferralCode");

const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      referralCode,
      placementPosition,
      registrationType,
      productId,
      agentId,
      joiningQuantity,
    } = req.body;

     // 🔹 Safe nominee parse
    let nominee;
    try {
      nominee = JSON.parse(req.body.nominee);
    } catch (err) {
      return res.status(400).json({ message: "Invalid nominee data format." });
    }

    // 🔐 Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: "First and last name are required." });
    }

    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    if (!phone?.trim() || !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ message: "Valid phone number is required (10-15 digits)." });
    }

    // Password validation (no trim/normalize)
    if (typeof password !== "string") {
      return res.status(400).json({ message: "Password is required." });
    }

    // Length bounds
    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({ message: "Password must be 8-16 characters." });
    }

    // Reject leading/trailing spaces WITHOUT mutating the password
    if (/^\s|\s$/.test(password)) {
      return res.status(400).json({ message: "Password cannot start or end with spaces." });
    }

    // Optional: strength/complexity rule (at least 1 lower, 1 upper, 1 digit, 1 symbol)
    const strongEnough = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/.test(password);
    if (!strongEnough) {
      return res.status(400).json({
        message: "Password must include upper, lower, number, and symbol."
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "User image is required." });
    }

    // **Address validation: Required and minimum 5 chars**
    if (!address || typeof address !== "string" || address.trim().length < 5) {
      return res.status(400).json({ message: "Address is required and should be at least 5 characters." });
    }

    if (!nominee?.firstName || !nominee?.lastName || !nominee?.relation || !nominee?.phone || !nominee?.address) {
      return res.status(400).json({ message: "Nominee details are required." });
    }

    if (!placementPosition?.trim()) {
      return res.status(400).json({ message: "Placement Position are required." });
    }

     // =====================================================
    //   🔥 PRODUCT OR DEPOSIT VALIDATION
    // =====================================================

    let registrationProduct = null;

    if (registrationType === "product") {
      if (!agentId) return res.status(400).json({ message: "Agent ID required for product registration." });
      if (!productId) return res.status(400).json({ message: "Product ID required." });
      if (!joiningQuantity || joiningQuantity <= 0) return res.status(400).json({ message: "Joining quantity required." });

      // Find product
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found!" });
      registrationProduct = product;

      // Find agent stock
      const agentStock = await AgentStock.findOne({ agentId });
      if (!agentStock) return res.status(400).json({ message: "Agent has no stock." });

      const stockItem = agentStock.products.find(p => p.productId.toString() === productId);
      if (!stockItem || stockItem.qty < joiningQuantity) {
        return res.status(400).json({ message: `Insufficient agent stock. Available: ${stockItem ? stockItem.qty : 0}` });
      }

      // Reduce stock by joining quantity
      stockItem.qty -= joiningQuantity;
      await agentStock.save();
    }

    if (registrationType === "deposit"){
        if (!depositTransactionId?.trim()) {
        return res.status(400).json({ message: "Deposit transaction ID is required for deposit registration." });
      }
    }

    // =====================================================
    // 🔥 (Your existing email, referral, slot validations stay SAME)
    // =====================================================

    const emailExist = await User.findOne({ email: email.trim().toLowerCase() });

    if (emailExist) {
      if (emailExist.isApproved === false) {
        return res.status(400).json({
          message: "This email is already used but not approved yet. Please approve your previous account first."
        });
      }
    }

    const isEmailVerifiedGlobally = emailExist?.isEmailVerified || false;

    // Check for referral code validity
    let parent = null;

    if (referralCode) {
      parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

      // ✅ fallback master referral code allow
      const isMasterCode = referralCode === "SR04102025F9G7K8Q2T1";

      if (!parent && !isMasterCode) {
        return res.status(400).json({ message: "Invalid referral code." });
      }

      if (parent) {
        if (parent.referralLocked) {
          return res.status(400).json({ message: "Referral user is locked." });
        }

        // ✅ Total children count (approved + reserved)
        const childrenCount = await User.countDocuments({
          parentId: parent._id,
          $or: [{ isApproved: true }, { isSlotReserved: true }],
        });

        if (childrenCount >= 3) {
          return res.status(400).json({ message: "Referral user already has 3 children or reserved slots." });
        }

        // ✅ এখন check করা হবে slot রিজার্ভ কিনা
        const slotTakenOrReserved = await User.findOne({
          parentId: parent._id,
          placementPosition,
          $or: [{ isApproved: true }, { isSlotReserved: true }],
        });

        if (slotTakenOrReserved) {
          return res.status(400).json({
            message: `Slot (${placementPosition}) is already taken or reserved.`,
          });
        }
      }
    }

    // ✅ Upload image
    const imageResult = await uploadToCloudinary(req.file.buffer);
    const imageUrl = imageResult.secure_url;
    const imagePublicId = imageResult.public_id;

    // Generate unique referral code for the new user
    const newReferralCode = await generateUniqueReferralCode(firstName, lastName);

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      isEmailVerified: isEmailVerifiedGlobally,
      phone: phone.trim(),
      password: password,
      image: imageUrl,
      imagePublicId: imagePublicId,
      address: address.trim(),
      referralCode: newReferralCode,
      referredBy: referralCode?.toUpperCase() || null,
      parentId: parent?._id || null,
      placementPosition: parent ? placementPosition : null, 
      childIndex: parent ? (placementPosition === "line one" ? 0 : placementPosition === "line two" ? 1 : 2) : null,
      isSlotReserved: parent ? true : false,
      reservedAt: parent ? new Date() : null,
      registrationType: registrationType,
      registrationProductId: registrationProduct ? registrationProduct._id : null,
      nominee: {
        firstName: nominee.firstName.trim(),
        lastName: nominee.lastName.trim(),
        relation: nominee.relation.trim(),
        phone: nominee.phone.trim(),
        address: nominee.address.trim(),
      },
    });

    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: "User registered successfully. Please verify your email.", 
      user: newUser 
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
};


const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Product ID required." });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    return res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        costPrice: product.costPrice,
        discount: product.discount,
        category: product.category,
        brand: product.brand,
        joining_quantity: product.joining_quantity ?? 1,
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {registerUser, getSingleProduct};