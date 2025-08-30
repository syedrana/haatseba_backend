const bcrypt = require("bcrypt");
const User = require("../../models/adminModel");

let adminRegistration = async (req, res) => {

    const { name, username, email, password } = req.body;

    if (!name?.trim()) {
        return res.status(400).send("Admin name is required");
    }

    if (!username?.trim()) {
        return res.status(400).send("Admin user name is required");
    }

    if (!email?.trim()) {
        return res.status(400).send("Admin email is required");
    }

    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).json({ message: "Email already in use." });

    if (!password) {
        return res.status(400).send("Admin password is required");
    }

    bcrypt.hash(password, 10, async function (err, hash) {
        let user = new User({
            name: name,
            username: username,
            email: email,
            password: hash,
        })
        user.save();

        res.status(201).json({ 
            message: "Admin registered successfully.", 
            user: user, 
        });
        
    });

};

module.exports = adminRegistration;