const Admin = require("../Model/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let login = async (req, res) => {
   
    try {
        const { name, password } = req.body;

        if (!name) {
            return res.status(400).send("Admin name is required");
        }

        if (!password) {
            return res.status(400).send("password is required");
        }

        let exitingUser = await Admin.findOne({name:name})

        if (exitingUser){
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
        return res.status(500).send("Internal server error");
    }  
}

module.exports = login;
