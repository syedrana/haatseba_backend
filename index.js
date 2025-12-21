require("dotenv").config();
const express = require("express");

// ✅ Middlewares
const securapi = require("./middlewares/secureApi.js");
const corsConfig = require("./middlewares/corsConfig");
const checklogin = require("./middlewares/checkLogin.js");
const checkadmin = require("./middlewares/checkAdmin.js");
const multerErrorHandler = require("./middlewares/uploadErrorHandler");
const upload = require("./middlewares/upload");

// ✅ Helper
const dbConnection = require("./helpers/dbConnection");

// ✅ User Routes Controller-------------------------------------------------------------
    
    // User registration
const registration = require("./controllers/user/registrationController");
const {registerProduct} = require("./controllers/user/registerproductController.js");

    // User verification
const verification = require("./controllers/user/verificationController");

    // User login
const login = require("./controllers/user/loginController");

    // User dashboard
const { getUserDashboard } = require("./controllers/user/dashboardController");

    // User tree
const { getDownlineTree } = require("./controllers/user/treeController");

    // User withdraw
const { requestWithdraw, getWalletBalance, getWithdrawHistory } = require("./controllers/user/withdrawController");

    // User profile
const {getProfile, getOwnProfile, getDashboardProfile, updateProfile, updatePassword} = require("./controllers/user/profileController");

    // User rewards
const {
    getMyRewards,
    claimReward,
    getMyClaims,
    getMyClaimById,
    cancelMyClaim,
} = require("./controllers/user/rewardsController.js");

    // User change password
const changePassword = require("./controllers/user/changePassword");

    // User Edit Profile
const {
    getMe,
    requestProfileUpdate,
    getPendingProfileUpdates,
    approveProfileUpdate,
    rejectProfileUpdate,
} = require("./controllers/user/editProfileController");

const {getmarketplaceProducts} = require("./controllers/user/marketplaceController");
const getreferralCode = require("./controllers/user/myreferralController");

const {createTopUpRequest, getAdminPendingTopUps, approveTopUp, rejectTopUp} = require("./controllers/user/topupController.js");

// 🟡 Auth Routes Controller----------------------------------------------------------------

const verifyEmail = require("./controllers/auth/verifyEmail");
const resendVerificationEmail = require("./controllers/auth/resendVerification");

// 🟡 Admin Routes Controller---------------------------------------------------------------

    // Admin login
const adminlogin = require("./controllers/admin/adminLoginController");

    // Admin registration
const adminreg = require("./controllers/admin/adminRegController");

    // Admin dashboard
const { 
    getAdminSummary, 
    getWithdrawTrend, 
    getLatestWithdraws,
} = require("./controllers/admin/dashboardController");

    // Admin user management
const { 
    getPendingUsers, 
    getApprovedUsers, 
    getRejectedUsers, 
    approveUser, 
    rejectUser, 
} = require("./controllers/admin/userManagementController");

    // Admin Withdraw management
const { 
    getPendingWithdrawal, 
    getApprovedWithdrawal, 
    getRejectedWithdrawal, 
    approveWithdraw, 
    rejectWithdraw, 
} = require("./controllers/admin/withdrawManagementController");

    // Admin bonus
const {
    listPendingBonuses,
    listAllBonuses,
    listApprovedBonuses,
    approveBonus,
    rejectBonus,
    markPaid,
    approveMobileRecharge,
} = require("./controllers/admin/adminBonusController.js");

    // Admin Bonus plan 
const {
  createBonusPlan,
  getAllBonusPlans,
  updateBonusPlan,
  deleteBonusPlan,
} = require("./controllers/admin/bonusPlanController");

    // Admin transction management
const {
    transaction, 
    transDetaiols
} = require("./controllers/admin/transactionManagementController");

    // Admin downline tree
const { getuserTree } = require("./controllers/admin/downlinetreeController.js");

    // Admin claim
const {
    getAllClaims,
    getSingleClaim,
    approveClaim,
    rejectClaim,
    markShipped,
    markDelivered,
    cancelClaim,
} = require("./controllers/admin/adminClaimController.js");

    

// ✅ Vendor Routes Controller-------------------------------------------------------------------

    // Vendor request
const {
    createVendorRequest,
    getAllVendorRequests,
    approveVendorRequest,
    rejectVendorRequest,
    getVendorRequestById,
    updateVendorRequestStatus,
    getMyVendorRequest,
} = require("./controllers/vendor/vendorController");

    // Vendor product
const {
    createProduct,
    getVendorProducts, 
    updateProduct, 
    deleteProduct 
} = require("./controllers/vendor/productController");

    // Vendor category
const { createCategory, getCategories } = require("./controllers/vendor/categoryController");

    // Vendor brand
const { createBrand, getBrands } = require("./controllers/vendor/brandController");

// ✅ Agent Routes Controller-------------------------------------------------------------------

const { 
    loadAgentPackages, 
    createPackage, 
    searchProduct,
    getAllPackages,
    getPackageById,
    updatePackage,
    deletePackage, 
} = require("./controllers/agent/packageController");

const {
    getMyWallet,
    placeAgentOrder,
    listAgentOrders,
    getAgentOrder,
    approveAgentOrder,
    rejectAgentOrder,
} = require("./controllers/agent/agentOrderController");

const { getMyAgentStock } = require("./controllers/agent/agentStockController");
const {registerUser, getSingleProduct} = require("./controllers/agent/productRegController");


const app =express();

// ✅ Database Connection
dbConnection();

// ✅ CORS Middleware
app.use(corsConfig);

// ✅ Middlewares
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// ✅ Static Files
app.use("/uploads", express.static("uploads"));

// ✅ User Routes------------------------------------------------------------------------------

app.post("/registration", multerErrorHandler(upload.single("image")), securapi, registration);
app.get("/registerproduct", securapi, registerProduct);
app.get("/verification", securapi, verification);
app.post("/login", securapi, login);
app.get("/userdashboard", checklogin, getUserDashboard);
app.get("/userdownlinetree", checklogin, getDownlineTree);
app.get("/walletbalance", checklogin, getWalletBalance);
app.post("/requestwithdraw", checklogin, requestWithdraw);
app.get("/withdrawhistory", checklogin, getWithdrawHistory);
app.post("/change-password", checklogin, changePassword);

app.get("/getreferralCode", checklogin, getreferralCode);

    // User profile controller
app.get("/getprofile", checklogin, getProfile);
app.get("/getownprofile/:id", checklogin, getOwnProfile);
app.get("/getdashboardprofile", checklogin, getDashboardProfile);
app.put("/updateprofile", checklogin, updateProfile);

    // Edit Profile Controller
app.get("/getme", checklogin, getMe);
app.put("/requestprofileupdate", checklogin, multerErrorHandler(upload.single("image")), requestProfileUpdate);
app.get("/getpendingprofileupdates", checkadmin, getPendingProfileUpdates);
app.put("/approveprofileupdate/:id", checkadmin, approveProfileUpdate);
app.put("/rejectProfileUpdate/:id", checkadmin, rejectProfileUpdate);

app.get("/getmarketplaceproducts", getmarketplaceProducts);

    // Rewards Controller
app.get("/getMyRewards", checklogin, getMyRewards);
app.post("/claimreward", checklogin, claimReward);
app.get("/myclaims", checklogin, getMyClaims);
app.get("/myclaims/:id", checklogin, getMyClaimById);
app.put("/myclaimscancel/:id", checklogin, cancelMyClaim);

    // Verify Email Controller
app.get("/verify-email", verifyEmail);
app.post("/resend-verification", resendVerificationEmail);


app.post("/createtopuprequest", checklogin, multerErrorHandler(upload.single("proof")), createTopUpRequest);
app.get("/getadminpendingtopUps", checkadmin, getAdminPendingTopUps);
app.patch("/approvetopUp/:id", checkadmin, approveTopUp);
app.patch("/rejecttopUp/:id", checkadmin, rejectTopUp);

// 🟡 Admin Routes---------------------------------------------------------------------------

    // Admin login & rag controller
app.post("/adminLogin", securapi, adminlogin);
app.post("/adminreg", securapi, adminreg);

    // Admin Dashboard Controller
app.get("/adminsummary", checkadmin,  getAdminSummary);
app.get("/withdrawstrend", checkadmin, getWithdrawTrend);
app.get("/withdrawslatest", checkadmin, getLatestWithdraws);

    // User Management Controller
app.get("/pendingusers", checkadmin,  getPendingUsers);
app.get("/approvedusers", checkadmin, getApprovedUsers);
app.get("/rejectedusers", checkadmin, getRejectedUsers);
app.patch("/approveuser/:id", checkadmin, approveUser);
app.patch("/rejectuser/:id", checkadmin, rejectUser);

app.get("/getuserprofile/:id", checkadmin, getOwnProfile);

    // Withdraw Management Controller
app.get("/pendingwithdrawal", checkadmin,  getPendingWithdrawal);
app.get("/approvedwithdrawal", checkadmin, getApprovedWithdrawal);
app.get("/rejectedwithdrawal", checkadmin, getRejectedWithdrawal);
app.patch("/approvewithdraw/:id", checkadmin, approveWithdraw);
app.patch("/rejectwithdraw/:id", checkadmin, rejectWithdraw);

    // Admin Bonus Controller
app.get("/listpendingbonuses", checkadmin, listPendingBonuses);
app.get("/listallbonuses", checkadmin, listAllBonuses);
app.get("/listapprovedbonuses", checkadmin, listApprovedBonuses);
app.patch("/approvebonus/:id", checkadmin, approveBonus);
app.patch("/rejectbonus/:id", checkadmin, rejectBonus);
app.patch("/markpaid/:id", checkadmin, markPaid);
app.patch("/approvemobilerecharge/:id", checkadmin, approveMobileRecharge);

    // Bonus Plan Controller
app.post("/createbonusplan", checkadmin, createBonusPlan);
app.get("/getallbonusplans", checklogin, getAllBonusPlans);
app.put("/updatebonusplan/:id", checkadmin, updateBonusPlan);
app.delete("/deletebonusplan/:id", checkadmin, deleteBonusPlan);

    // Transsaction Management Controller
app.get("/transaction", checkadmin, transaction);
app.get("/transactiondetails", checkadmin, transDetaiols);

    // Downlinetree Controlller
app.get("/usertree/:id", checkadmin,  getuserTree);

    // Admin Claim Controller
app.get("/claims",checkadmin, getAllClaims);
app.get("/singleclaims/:id",checkadmin, getSingleClaim);
app.put("/claimsapprove/:id", checkadmin, approveClaim);
app.put("/claimsreject/:id", checkadmin, rejectClaim);
app.put("/claimsshipped/:id", checkadmin, markShipped);
app.put("/claimsdelivered/:id", checkadmin, markDelivered);
app.put("/claimscancel/:id", checkadmin, cancelClaim);

// ✅ Vendor Route--------------------------------------------------------------------------
    //user
app.post("/vendorrequest", checklogin, multerErrorHandler(upload.array("documents", 6)), createVendorRequest);
app.get("/myrequest", checklogin, getMyVendorRequest);
app.post("/vendoraddproduct", checklogin, multerErrorHandler(upload.single("image")), createProduct);

app.get("/allcategories", checklogin, getCategories);
app.get("/allbrands", checklogin, getBrands);

app.get("/vendorproducts", checklogin, getVendorProducts);
app.put("/vendorproductupdate/:id", checklogin, multerErrorHandler(upload.single("image")), updateProduct);
app.delete("/vendorproductdelete/:id", checklogin, deleteProduct);




    //Admin
app.get("/vendor/requests", checkadmin, getAllVendorRequests);
app.get("/vendor/requests/:id", checkadmin, getVendorRequestById);
app.put("/approvevendorrequest/:id", checkadmin, approveVendorRequest);
app.put("/rejectvendorrequest/:id", checkadmin, rejectVendorRequest);
app.patch("/vendor/request/:id", checkadmin, updateVendorRequestStatus);

app.post("/createcategory", checkadmin, createCategory);
app.get("/allcategories/search", checkadmin, getCategories);
app.post("/createbrand", checkadmin, createBrand);

// ✅ Agent Route--------------------------------------------------------------------------
   
    //Admin
app.post("/createpackage", checkadmin, createPackage);
app.get("/searchproduct", checkadmin, searchProduct);
app.get("/getallpackages", checkadmin, getAllPackages);
app.get("/getpackagebyid/:id", checkadmin, getPackageById);
app.put("/updatepackage/:id", checkadmin, updatePackage);
app.delete("/deletepackage/:id", checkadmin, deletePackage);

    // Admin Agent Onder Controller
app.get("/agentorders", checkadmin, listAgentOrders);
app.get("/getagentorder/:id", checkadmin, getAgentOrder);
app.post("/approveagentorder/:id", checkadmin, approveAgentOrder);
app.post("/rejectagentorder/:id", checkadmin, rejectAgentOrder);

    //user
app.get("/loadagentpackages", checklogin, loadAgentPackages);
app.post("/placeagentorder", checklogin, placeAgentOrder);
app.get("/getmywallet", checklogin, getMyWallet);

    // User Agent Stock Controller
app.get("/getmyagentstock", checklogin, getMyAgentStock);
    //User Agent Product Reg Controller
app.post("/registeruser", multerErrorHandler(upload.single("image")), checklogin, registerUser);
app.get("/singleproduct/:id", checklogin, getSingleProduct);

// ✅ Root Route (for Render test)----------------------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ Haatseba Backend API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});