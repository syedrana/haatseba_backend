require("dotenv").config();
const express = require("express");

// ✅ Middlewares
const securapi = require("./middlewares/secureApi.js");
const corsConfig = require("./middlewares/corsConfig");
const checklogin = require("./middlewares/checkLogin.js");
const multerErrorHandler = require("./middlewares/uploadErrorHandler");
const upload = require("./middlewares/upload");

// ✅ Helper
const dbConnection = require("./helpers/dbConnection");

// ✅ User Routes Controller
const registration = require("./controllers/user/registrationController");
const verification = require("./controllers/user/verificationController");
const login = require("./controllers/user/loginController");
const { getUserDashboard } = require("./controllers/user/dashboardController");
const { getDownlineTree } = require("./controllers/user/treeController");
const { requestWithdraw, getWalletBalance } = require("./controllers/user/withdrawController");
const {getProfile, getOwnProfile, getDashboardProfile, updateProfile, updatePassword} = require("./controllers/user/profileController");

// 🟡 Admin Routes Controller
const {approveWithdraw, rejectWithdraw,} = require("./controllers/user/withdrawController");
const adminlogin = require("./controllers/admin/adminLoginController");
const adminreg = require("./controllers/admin/adminRegController");

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

// ✅ User Routes
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

// 🟡 Admin Routes
app.put("/approvewithdraw", checklogin, approveWithdraw);
app.put("/rejectwithdraw", checklogin, rejectWithdraw);
app.post("/adminLogin", securapi, adminlogin);
app.post("/adminreg", securapi, adminreg);

// ✅ Root Route (for Render test)
app.get("/", (req, res) => {
  res.send("✅ Haatseba Backend API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});