const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let login = async (req, res) => {
   
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).send("Email is required");
        }

        if (!password) {
            return res.status(400).send("password is required");
        }

        // ✅ include password explicitly
        let exitingUser = await User.findOne({ email: email.toLowerCase() }).select("+password");

        if (exitingUser){

        //   // ✅ Check if user is email verification
        //   if (!exitingUser.isVerified) {
        //       return res.status(400).send("Your account is pending Email Verification.");
        //   } 

        //     // ✅ Check if user is approved by admin
        //   if (!exitingUser.isApproved) {
        //       return res.status(400).send("Your account is pending admin approval.");
        //   }

          bcrypt.compare(password, exitingUser.password, function(err, result) {
            if (result){

                const token = jwt.sign({
                    username: exitingUser.name,
                    userid: exitingUser._id,
                    role: exitingUser.role,
                }, process.env.JWT_SECRET,{
                    expiresIn: "1h"
                });

                res.status(200).json({
                    "access_token": token,
                    "message": "Login Successful",
                    "role": exitingUser.role,
                });

            }else{
                
                return res.status(400).send("Invalid credentials");
            }
        });
        } else {
            
            return res.status(400).send("Invalid credentials");
        }
    } 
    catch (error) {
        console.log(error);
        res.status(400).status("Invalid credentials");
    }  
}

module.exports = login;