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



    // // Push to parent's children array
    // if (parent) {

    //   parent.children.push(newUser._id);

    //   await parent.save();

    //   // লেভেল আপডেট কল
    //   await updateUserLevel(parent._id);

    // }

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
















// const User = require("../../models/userModel");
// const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
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
//       registrationType,
//       depositTransactionId,
//     } = req.body;

//      // 🔹 Safe nominee parse
//     let nominee;
//     try {
//       nominee = JSON.parse(req.body.nominee);
//     } catch (err) {
//       return res.status(400).json({ message: "Invalid nominee data format." });
//     }

//     // 🔐 Validation
//     if (!firstName?.trim() || !lastName?.trim()) {
//       return res.status(400).json({ message: "First and last name are required." });
//     }

//     if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
//       return res.status(400).json({ message: "Valid email is required." });
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

//     if (!depositTransactionId?.trim()) {
//       return res.status(400).json({ message: "Deposit transaction ID is required for deposit registration." });
//     }

//     const emailExist = await User.findOne({ email: email.trim().toLowerCase() });

//     if (emailExist) {
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

//       // ✅ fallback master referral code allow
//       const isMasterCode = referralCode === "SR04102025F9G7K8Q2T1";

//       if (!parent && !isMasterCode) {
//         return res.status(400).json({ message: "Invalid referral code." });
//       }

//       if (parent) {
//         if (parent.referralLocked) {
//           return res.status(400).json({ message: "Referral user is locked." });
//         }

//         // ✅ Total children count (approved + reserved)
//         const childrenCount = await User.countDocuments({
//           parentId: parent._id,
//           $or: [{ isApproved: true }, { isSlotReserved: true }],
//         });

//         if (childrenCount >= 3) {
//           return res.status(400).json({ message: "Referral user already has 3 children or reserved slots." });
//         }

//         // ✅ এখন check করা হবে slot রিজার্ভ কিনা
//         const slotTakenOrReserved = await User.findOne({
//           parentId: parent._id,
//           placementPosition,
//           $or: [{ isApproved: true }, { isSlotReserved: true }],
//         });

//         if (slotTakenOrReserved) {
//           return res.status(400).json({
//             message: `Slot (${placementPosition}) is already taken or reserved.`,
//           });
//         }
//       }
//     }

//     // ✅ Upload image
//     const imageResult = await uploadToCloudinary(req.file.buffer);
//     const imageUrl = imageResult.secure_url;
//     const imagePublicId = imageResult.public_id;

//     // Generate unique referral code for the new user
//     const newReferralCode = await generateUniqueReferralCode(firstName, lastName);

//     const newUser = new User({
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       email: email.trim().toLowerCase(),
//       isEmailVerified: isEmailVerifiedGlobally,
//       phone: phone.trim(),
//       password: password,
//       image: imageUrl,
//       imagePublicId: imagePublicId,
//       address: address.trim(),
//       referralCode: newReferralCode,
//       referredBy: referralCode?.toUpperCase() || null,
//       parentId: parent?._id || null,
//       placementPosition: parent ? placementPosition : null, // ✅ slot assign
//       childIndex: parent ? (placementPosition === "line one" ? 0 : placementPosition === "line two" ? 1 : 2) : null,
//       isSlotReserved: parent ? true : false,
//       reservedAt: parent ? new Date() : null,
//       registrationType: registrationType,
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

//   } catch (error) {
//     console.error("Registration error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during registration.",
//     });
//   }
// };

// module.exports = registerUser;




































const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const Product = require("../../models/vendor/vendorproductModel");
const AgentStock = require("../../models/agent/agentStockModel");
//const Settings = require("../../models/settingsModel");
const uploadToCloudinary = require("../../helpers/uploadToCloudinaryHelper");
const generateUniqueReferralCode = require("../../utils/generateReferralCode"); 

const abortTxn = async (res, session, status, message) => {
  await session.abortTransaction();
  session.endSession();
  return res.status(status).json({ success: false, message });
};


const registerUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
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
    } = req.body;

    const userId = req.userid;
    if (!userId) return abortTxn(res, session, 400, "User ID required for product registration.");
    
    let registrationProduct = null;
    
    /* -------------------- SETTINGS -------------------- */
    //const Settings = sdfdfsd;
    //const feeSetting = await Settings.findOne({ key: "registration_fee" }).session(session);
    const feeSetting = 20;
    const registrationFee = Number(feeSetting?.value || 20);

    let wallet= await Wallet.findOne({ userId }).session(session);
   
    if (!["deposit", "product"].includes(registrationType)) {
      return abortTxn(res, session, 400, "Invalid registration type.");
    }

    if (registrationType === "deposit"){
    
      if (!wallet) {
        return abortTxn(res, session, 400, "Wallet not found.");
      }

      if (wallet.cashBalance < registrationFee) {
        return abortTxn(res, session, 400, "Insufficient wallet balance.");
      }

      wallet.cashBalance -= registrationFee;
      await wallet.save({ session });

    }
      
    if (registrationType === "product"){
      
      if (!productId) return abortTxn(res, session, 400, "Product ID required.");
      
      // Find product
      const product = await Product.findById(productId).session(session);
      if (!product) return abortTxn(res, session, 404, "Product not found.");

      registrationProduct = product;

      // Find agent stock
      const agentStock = await AgentStock.findOne({ agentId: userId }).session(session);

      if (!agentStock) return abortTxn(res, session, 400, "Agent has no stock.");

      const stockItem = agentStock.products.find(p => p.productId.equals(productId));

      if (!stockItem) {
        return abortTxn(res, session, 400, "Product not in agent stock.");
      }

      const joiningQuantity = Number(stockItem.joining_quantity);

      if (!joiningQuantity || joiningQuantity <= 0) return abortTxn(res, session, 400, "Invalid joining quantity.");

      if (!stockItem || stockItem.qty < joiningQuantity) {
        return abortTxn(res, session, 400, `Insufficient agent stock. Available: ${stockItem ? stockItem.qty : 0}`); 
      }

      // Reduce stock by joining quantity
      stockItem.qty -= joiningQuantity;
      await agentStock.save({ session });
    }

    
    /* -------------------- BASIC VALIDATION -------------------- */
    if (!firstName?.trim() || !lastName?.trim()) {
      return abortTxn(res, session, 400, "First and last name are required.");
    }

    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return abortTxn(res, session, 400, "Valid email is required.");
    }

    if (!phone?.trim() || !/^01[3-9]\d{8}$/.test(phone)) {
      return abortTxn(res, session, 400, "Valid Bangladeshi phone number is required.");
    }


    // Password validation (no trim/normalize)
    if (typeof password !== "string") {
      return abortTxn(res, session, 400, "Password is required.");
    }

    if (!req.file) {
      return abortTxn(res, session, 400, "User image is required.");
    }

    // **Address validation: Required and minimum 5 chars**
    if (!address || typeof address !== "string" || address.trim().length < 5) {
      return abortTxn(res, session, 400, "Address is required and should be at least 5 characters.");
    }

    const validPositions = ["line one", "line two", "line three"];
    if (referralCode && !placementPosition) {
      return abortTxn(res, session, 400, "Placement position required.");
    }

    if (referralCode && !validPositions.includes(placementPosition))
      return abortTxn(res, session, 400, "Invalid placement position.");

    /* -------------------- NOMINEE -------------------- */

    let nominee;
    try {
      nominee = JSON.parse(req.body.nominee);
    } catch (err) {
      return abortTxn(res, session, 400, "Invalid nominee format.");
    }

    if (!nominee?.firstName || !nominee?.lastName || !nominee?.relation || !nominee?.phone || !nominee?.address) {
      return abortTxn(res, session, 400, "Nominee details are required.");
    }

    /* -------------------- EMAIL DUPLICATE -------------------- */

    const emailExist = await User.findOne({ email: email.trim().toLowerCase() });

    if (emailExist) {
      if (emailExist.isApproved === false) {
        return abortTxn(res, session, 400, "This email is already used but not approved yet. Please approve your previous account first.");
      }
    }

    // const isEmailVerifiedGlobally = emailExist?.isEmailVerified || false;
    const isEmailVerifiedGlobally = false;


    /* -------------------- REFERRAL & MLM -------------------- */
    let parent = null;

    if (referralCode) {
      parent = await User.findOne({ referralCode: referralCode.toUpperCase() });

      // ✅ fallback master referral code allow
      const isMasterCode = referralCode === process.env.MASTER_REFERRAL_CODE;

      if (!parent && !isMasterCode) {
        return abortTxn(res, session, 400, "Invalid referral code.");
      }

      if (parent) {
        if (parent.referralLocked) {
          return abortTxn(res, session, 400, "Referral user is locked.");
        }

        // ✅ Total children count (approved + reserved)
        const childrenCount = await User.countDocuments({
          parentId: parent._id,
          $or: [{ isApproved: true }, { isSlotReserved: true }],
        });

        if (childrenCount >= 3) {
          return abortTxn(res, session, 400, "Referral user already has 3 children or reserved slots.");
        }

        // ✅ এখন check করা হবে slot রিজার্ভ কিনা
        const slotTakenOrReserved = await User.findOne({
          parentId: parent._id,
          placementPosition,
          $or: [{ isApproved: true }, { isSlotReserved: true }],
        });

        if (slotTakenOrReserved) {
          return abortTxn(res, session, 400, `Slot ${placementPosition} already taken or reserved.`);
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
      placementPosition: parent ? placementPosition : null, // ✅ slot assign
      childIndex: parent ? validPositions.indexOf(placementPosition) : null,
      isSlotReserved: parent ? true : false,
      reservedAt: parent ? new Date() : null,
      registrationType: registrationType,
      registrationProductId: registrationProduct ? registrationProduct._id : null,
      depositAmount: registrationType === "deposit" ? registrationFee : 0,
      nominee: {
        firstName: nominee.firstName.trim(),
        lastName: nominee.lastName.trim(),
        relation: nominee.relation.trim(),
        phone: nominee.phone.trim(),
        address: nominee.address.trim(),
      },
    });

    await newUser.save({ session });

    if (registrationType === "deposit") {
      await Transaction.create(
        [
          {
            userId,
            type: "debit",
            amount: registrationFee,
            category: "deposit_registration",
            relatedModel: "User",
            relatedId: newUser._id,
            description: "New user registration fee",
            status:"completed",
            runningBalance: wallet.cashBalance,
          },
        ],
        { session }
      );
    }

    if (registrationType === "product") {
      await Transaction.create(
        [{
          userId,
          type: "debit",
          amount: 0,
          category: "product_registration",
          relatedModel: "Product",
          relatedId: registrationProduct._id,
          description: "Product-based registration (stock deducted)",
          status: "completed",
          runningBalance: wallet.cashBalance,
        }],
        { session }
      );
    }

    
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      success: true,
      message: "User registered successfully. Please verify your email.", 
      userId: newUser._id, 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
};

module.exports = registerUser;

