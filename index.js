require("dotenv").config();
const express = require("express");
const cors = require("cors");
const securapi = require("./middlewares/secureApi.js");
const dbConnection = require("./helpers/dbConnection");
const registration = require("./controllers/registrationController");
const verification = require("./controllers/verificationController");




const app =express();

// ✅ Database Connection
dbConnection();

// ✅ Middlewares
app.use(express.json());
app.use(cors());

// ✅ Static Files
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.post("/registration", securapi, registration);
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