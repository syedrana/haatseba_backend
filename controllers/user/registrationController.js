// const User = require("../../models/userModel");
// const {updateUserLevel} = require("../../helpers/levelHelper");
// const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
// //const sendEmailVerification = require("../../utils/sendEmailVerification");
// const generateUniqueReferralCode = require("../../utils/generateReferralCode");    


// const registerUser = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       address,
//       referralCode,
//       placementPosition,
//       depositTransactionId,
//     } = req.body;

//     const nominee = JSON.parse(req.body.nominee);


//     // 🔐 Validation
//     if (!firstName?.trim() || !lastName?.trim()) {
//       return res.status(400).json({ message: "First and last name are required." });
//     }

//     if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
//       return res.status(400).json({ message: "Valid email is required." });
//     }

//     if (!depositTransactionId?.trim()) {
//       return res.status(400).json({ message: "deposit transaction id are required." });
//     }

//     if (!phone?.trim() || !/^\d{10,15}$/.test(phone)) {
//       return res.status(400).json({ message: "Valid phone number is required (10-15 digits)." });
//     }

//     // Password validation (no trim/normalize)
//     if (typeof password !== "string") {
//       return res.status(400).json({ message: "Password is required." });
//     }

//     // Length bounds
//     if (password.length < 8 || password.length > 16) {
//       return res.status(400).json({ message: "Password must be 8-16 characters." });
//     }

//     // Reject leading/trailing spaces WITHOUT mutating the password
//     if (/^\s|\s$/.test(password)) {
//       return res.status(400).json({ message: "Password cannot start or end with spaces." });
//     }

//     // Optional: strength/complexity rule (at least 1 lower, 1 upper, 1 digit, 1 symbol)
//     const strongEnough = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/.test(password);
//     if (!strongEnough) {
//       return res.status(400).json({
//         message: "Password must include upper, lower, number, and symbol."
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "User image is required." });
//     }

//     // **Address validation: Required and minimum 5 chars**
//     if (!address || typeof address !== "string" || address.trim().length < 5) {
//       return res.status(400).json({ message: "Address is required and should be at least 5 characters." });
//     }

//     if (!nominee?.firstName || !nominee?.lastName || !nominee?.relation || !nominee?.phone || !nominee?.address) {
//       return res.status(400).json({ message: "Nominee details are required." });
//     }

//     if (!placementPosition?.trim()) {
//       return res.status(400).json({ message: "Placement Position are required." });
//     }


//     const emailExist = await User.findOne({ email });

//     if (emailExist) {
//       // if (emailExist.isEmailVerified === false) {
//       //   return res.status(400).json({
//       //     message: "This email is already used but not verified yet. Please verify your previous account first."
//       //   });
//       // }

//       if (emailExist.isApproved === false) {
//         return res.status(400).json({
//           message: "This email is already used but not approved yet. Please approve your previous account first."
//         });
//       }
//     }

//     const isEmailVerifiedGlobally = emailExist?.isEmailVerified || false;

//     // Check for referral code validity
//     let parent = null;

//     if (referralCode) {
//       parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

//       // প্রথম ইউজার বা কোন রেফারেল না থাকলে স্কিপ
//       if (!parent && referralCode !== "SR04102025F9G7K8Q2T1") {
//         return res.status(400).json({ message: "Invalid referral code." });
//       }

//       if (parent) {
//         if (parent.children.length >= 3) {
//           return res.status(400).json({ message: "Referral user already has 3 children." });
//         }
//         level = parent.level + 1;
//       }
//     }

//     if (referralCode) {
//       parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

//       if (!parent && referralCode !== "SR04102025F9G7K8Q2T1") {
//         return res.status(400).json({ message: "Invalid referral code." });
//       }

//       if (parent.referralLocked || parent.children.length >= 3) {
//         return res.status(400).json({ message: "Referral user already has 3 children." });
//       }

//       // Check slot availability
//       const usedSlots = await User.find({ parentId: parent._id }).select("placementPosition");

//       if (usedSlots.some(u => u.placementPosition === placementPosition)) {
//         return res.status(400).json({ message: `This slot (${placementPosition}) already taken.` });
//       }

//     }

//     // ✅ Upload image
//     const imageResult = await uploadToCloudinary(req.file.buffer);
//     const imageUrl = imageResult.secure_url;

//     // Generate unique referral code for the new user
//     //const newReferralCode = (firstName.slice(0, 2) + Date.now().toString().slice(-5)).toUpperCase();

//     const newReferralCode = await generateUniqueReferralCode(firstName, lastName);

//     const newUser = new User({
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       email: email.trim().toLowerCase(),
//       isEmailVerified: isEmailVerifiedGlobally,
//       phone: phone.trim(),
//       password: password,
//       image: imageUrl,
//       address: address.trim(),
//       referralCode: newReferralCode,
//       referredBy: referralCode?.toUpperCase() || null,
//       parentId: parent?._id || null,
//       placementPosition: parent ? placementPosition : null, // ✅ slot assign
//       childIndex: parent ? (placementPosition === "line one" ? 0 : placementPosition === "line two" ? 1 : 2) : null,
//       depositTransactionId: depositTransactionId,
//       nominee: {
//         firstName: nominee.firstName.trim(),
//         lastName: nominee.lastName.trim(),
//         relation: nominee.relation.trim(),
//         phone: nominee.phone.trim(),
//         address: nominee.address.trim(),
//       },
//     });

//     await newUser.save();

//     res.status(201).json({ 
//       success: true,
//       message: "User registered successfully. Please verify your email.", 
//       user: newUser 
//     });



//     // Push to parent's children array
//     if (parent) {

//       parent.children.push(newUser._id);

//       await parent.save();

//       // লেভেল আপডেট কল
//       await updateUserLevel(parent._id);

//     }

//     // Send email verification 
//     // setTimeout(async () => {
//     //   try {
//     //     await sendEmailVerification(newUser);
//     //     console.log(`✅ Verification email sent to ${newUser.email}`);
//     //   } catch (emailErr) {
//     //     console.error("❌ Email sending failed:", emailErr.message);
//     //   }
//     // }, 0);

    

//   } catch (error) {
//     console.error("Registration error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during registration.",
//     });
//   }
// };



// module.exports = registerUser;
















const User = require("../../models/userModel");
const Product = require("../../models/vendor/vendorproductModel");
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
      depositTransactionId,
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

    if (!depositTransactionId?.trim()) {
        return res.status(400).json({ message: "Deposit transaction ID is required for deposit registration." });
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
      address: address.trim(),
      referralCode: newReferralCode,
      referredBy: referralCode?.toUpperCase() || null,
      parentId: parent?._id || null,
      placementPosition: parent ? placementPosition : null, // ✅ slot assign
      childIndex: parent ? (placementPosition === "line one" ? 0 : placementPosition === "line two" ? 1 : 2) : null,
      isSlotReserved: parent ? true : false,
      reservedAt: parent ? new Date() : null,
      depositTransactionId: depositTransactionId,
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

const registerProduct = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .select("_id name price costPrice");

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;