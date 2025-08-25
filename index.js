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
const registration = require("./controllers/registrationController");
const verification = require("./controllers/verificationController");
const login = require("./controllers/loginController");
const { getUserDashboard } = require("./controllers/dashboardController");
const { getDownlineTree } = require("./controllers/treeController");
const { requestWithdraw } = require("./controllers/withdrawController");

// 🟡 Admin Routes Controller
const {approveWithdraw, rejectWithdraw,} = require("./controllers/withdrawController");


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
app.post("/requestwithdraw", checklogin, requestWithdraw);

// 🟡 Admin Routes
app.put("/approvewithdraw", checklogin, approveWithdraw);
app.put("/rejectwithdraw", checklogin, rejectWithdraw);

// ✅ Root Route (for Render test)
app.get("/", (req, res) => {
  res.send("✅ Haatseba Backend API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});