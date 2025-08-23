require("dotenv").config();
const express = require("express");
const securapi = require("./middlewares/secureApi.js");
const corsConfig = require("./middlewares/corsConfig");
const multerErrorHandler = require("./middlewares/uploadErrorHandler");
const upload = require("./middlewares/upload");
const dbConnection = require("./helpers/dbConnection");
const registration = require("./controllers/registrationController");
const verification = require("./controllers/verificationController");




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

// ✅ Routes
app.post("/registration", multerErrorHandler(upload.single("image")), securapi, registration);

app.get("/verification", securapi, verification);

// ✅ Root Route (for Render test)
app.get("/", (req, res) => {
  res.send("✅ Haatseba Backend API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});