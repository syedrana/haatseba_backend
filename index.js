require("dotenv").config();
const express = require("express");
const cors = require("cors");
const securapi = require("./middlewares/secureApi.js");
const checkLogin = require("./middlewares/checkLogin");
const adminCheck = require("./middlewares/checkAdmin.js");
const dbConnection = require("./helpers/dbConnection");
const registration = require("./controllers/registrationController");
const verification = require("./controllers/verificationController");
//const {runTest} = require("./tests/levelTest");



const app =express();

dbConnection();
//runTest();

app.use(express.json());
app.use(cors());

app.use("/uploads", express.static("uploads"));


app.post("/registration", securapi, registration);
app.get("/verification", securapi, verification);



app.listen(7000, ()=> {
    console.log("Server is running on port 7000");
});