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
const registration = require("./controllers/user/registrationController");
const verification = require("./controllers/user/verificationController");
const login = require("./controllers/user/loginController");
const { getUserDashboard } = require("./controllers/user/dashboardController");
const { getDownlineTree } = require("./controllers/user/treeController");
const { requestWithdraw, getWalletBalance } = require("./controllers/user/withdrawController");
const {getProfile, getOwnProfile, getDashboardProfile, updateProfile, updatePassword} = require("./controllers/user/profileController");
const verifyEmail = require("./controllers/auth/verifyEmail");
const resendVerificationEmail = require("./controllers/auth/resendVerification");

// 🟡 Admin Routes Controller---------------------------------------------------------------
const adminlogin = require("./controllers/admin/adminLoginController");
const adminreg = require("./controllers/admin/adminRegController");

const { 
    getAdminSummary, 
    getWithdrawTrend, 
    getLatestWithdraws,
} = require("./controllers/admin/dashboardController");

const { 
    getPendingUsers, 
    getApprovedUsers, 
    getRejectedUsers, 
    approveUser, 
    rejectUser, 
} = require("./controllers/admin/userManagementController");

const { 
    getPendingWithdrawal, 
    getApprovedWithdrawal, 
    getRejectedWithdrawal, 
    approveWithdraw, 
    rejectWithdraw, 
} = require("./controllers/admin/withdrawManagementController");

const {transaction, transDetaiols} = require("./controllers/admin/transactionManagementController");
const { getuserTree } = require("./controllers/admin/downlinetreeController.js");

// ✅ Vendor Routes Controller-------------------------------------------------------------------
const {
    createVendorRequest,
    getAllVendorRequests,
    approveVendorRequest,
    rejectVendorRequest,
    getVendorRequestById,
    updateVendorRequestStatus,
    getMyVendorRequest,
} = require("./controllers/vendor/vendorController");
const {createProduct} = require("./controllers/vendor/productController");
const { createCategory, getCategories } = require("./controllers/vendor/categoryController");
const { createBrand, getBrands } = require("./controllers/vendor/brandController");


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
app.get("/verification", securapi, verification);
app.post("/login", securapi, login);
app.get("/userdashboard", checklogin, getUserDashboard);
app.get("/userdownlinetree", checklogin, getDownlineTree);
app.get("/walletbalance", checklogin, getWalletBalance);
app.post("/requestwithdraw", checklogin, requestWithdraw);
app.get("/getprofile", checklogin, getProfile);
app.get("/getownprofile/:id", checklogin, getOwnProfile);
app.get("/getdashboardprofile", checklogin, getDashboardProfile);
app.put("/updateprofile", checklogin, updateProfile);

    // Verify Email Controller
app.get("/verify-email", verifyEmail);
app.post("/resend-verification", resendVerificationEmail);

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

    // Withdraw Management Controller
app.get("/pendingwithdrawal", checkadmin,  getPendingWithdrawal);
app.get("/approvedwithdrawal", checkadmin, getApprovedWithdrawal);
app.get("/rejectedwithdrawal", checkadmin, getRejectedWithdrawal);
app.patch("/approvewithdraw/:id", checkadmin, approveWithdraw);
app.patch("/rejectwithdraw/:id", checkadmin, rejectWithdraw);

    // Transsaction Management Controller
app.get("/transaction", checkadmin, transaction);
app.get("/transactiondetails", checkadmin, transDetaiols);

    // Downlinetree Controlller
app.get("/usertree/:id", checkadmin,  getuserTree);

// ✅ Vendor Route--------------------------------------------------------------------------
    //user
app.post("/vendorrequest", checklogin, multerErrorHandler(upload.array("documents", 6)), createVendorRequest);
app.get("/myrequest", checklogin, getMyVendorRequest);
app.post("/vendoraddproduct", checklogin, multerErrorHandler(upload.single("image")), createProduct);
app.post("/createcategory", checklogin, createCategory);
app.get("/allcategories", checklogin, getCategories);
app.post("/createbrand", checklogin, createBrand);
app.get("/allbrands", checklogin, getBrands);

    //Admin
app.get("/vendor/requests", checkadmin, getAllVendorRequests);
app.get("/vendor/requests/:id", checkadmin, getVendorRequestById);
app.put("/approvevendorrequest/:id", checkadmin, approveVendorRequest);
app.put("/rejectvendorrequest/:id", checkadmin, rejectVendorRequest);
app.patch("/vendor/request/:id", checkadmin, updateVendorRequestStatus);


// ✅ Root Route (for Render test)----------------------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ Haatseba Backend API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});