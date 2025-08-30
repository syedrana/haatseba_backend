const mongoose = require("mongoose");
const {Schema} = mongoose

const adminSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter name"]
  },
  username: {
    type: String,
    required: [true, "Please enter name"]
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "Please enter password"]
  },
  role: {
    type: String,
    default: "admin"
  }
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
