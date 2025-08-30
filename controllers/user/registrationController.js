const User = require("../../models/userModel");
const {updateUserLevel} = require("../../helpers/levelHelper");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
const sendEmailVerification = require("../../utils/sendEmailVerification");    


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
      nominee,
      placementPosition,
    } = req.body;

    // 🔐 Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: "First and last name are required." });
    }

    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "This phone number has been used before. ❌" });
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

    if (!nominee?.firstName || !nominee?.lastName || !nominee?.relation || !nominee?.phone) {
      return res.status(400).json({ message: "Nominee details are required." });
    }

    if (!placementPosition?.trim()) {
      return res.status(400).json({ message: "Placement Position are required." });
    }

    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).json({ message: "Email already in use." });

    // Check for referral code validity
    let parent = null;

//     if (referralCode) {
//   parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

//   // প্রথম ইউজার বা কোন রেফারেল না থাকলে স্কিপ
//   if (!parent && referralCode !== "AD00001") {
//     return res.status(400).json({ message: "Invalid referral code." });
//   }

//   if (parent) {
//     if (parent.children.length >= 3) {
//       return res.status(400).json({ message: "Referral user already has 3 children." });
//     }
//     level = parent.level + 1;
//   }
// }

    if (referralCode) {
      parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

      if (!parent) {
        return res.status(400).json({ message: "Invalid referral code." });
      }

      if (parent.referralLocked || parent.children.length >= 3) {
        return res.status(400).json({ message: "Referral user already has 3 children." });
      }

      // Check slot availability
      const usedSlots = await User.find({ parentId: parent._id }).select("placementPosition");

      if (usedSlots.some(u => u.placementPosition === placementPosition)) {
        return res.status(400).json({ message: `This slot (${placementPosition}) already taken.` });
      }

    }

    // ✅ Upload image
    const imageResult = await uploadToCloudinary(req.file.buffer);
    const imageUrl = imageResult.secure_url;

    // Generate unique referral code for the new user
    const newReferralCode = (firstName.slice(0, 2) + Date.now().toString().slice(-5)).toUpperCase();

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
      image: imageUrl,
      address: address.trim(),
      referralCode: newReferralCode,
      referredBy: referralCode?.toUpperCase() || null,
      parentId: parent?._id || null,
      placementPosition: parent ? placementPosition : null, // ✅ slot assign
      childIndex: parent ? (placementPosition === "left" ? 0 : placementPosition === "middle" ? 1 : 2) : null,
      nominee: {
        firstName: nominee.firstName.trim(),
        lastName: nominee.lastName.trim(),
        relation: nominee.relation.trim(),
        phone: nominee.phone.trim(),
      },
    });

    await newUser.save();



    // Push to parent's children array
    if (parent) {

      parent.children.push(newUser._id);

      await parent.save();

      // লেভেল আপডেট কল
      await updateUserLevel(parent._id);

    }

    // Send email verification 
    //await sendEmailVerification(newUser);

    res.status(201).json({ 
      message: "User registered successfully. Please verify your email.", 
      user: newUser 
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};



module.exports = registerUser;