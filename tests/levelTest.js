const mongoose = require("mongoose");
const User = require("../models/userModel");
const { updateUserLevel } = require("../helper/levelHelper"); // তোমার updateUserLevel ফাইল

// // 🚀 MongoDB connect
// async function connectDB() {
//   await mongoose.connect("mongodb://127.0.0.1:27017/mlm_test", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
//   console.log("✅ MongoDB Connected");
// }

// 🧪 Test Function
async function runTest() {
  //await connectDB();

  // 🔄 পুরনো ডাটা মুছে দাও
  await User.deleteMany({});

  // Root User তৈরি করো
  const root = await User.create({
    firstName: "Root User",
    level: 0,
    children: [],
    referralLocked: false
  });

  console.log("👉 Root user created:", root._id);

  // --- Step 1: ৩টা child add করবো ---
  const child1 = await User.create({ firstName: "Child 1", parentId: root._id, level: 0, children: [] });
  const child2 = await User.create({ firstName: "Child 2", parentId: root._id, level: 0, children: [] });
  const child3 = await User.create({ firstName: "Child 3", parentId: root._id, level: 0, children: [] });

  // root-এর children সেট করা
  root.children = [child1._id, child2._id, child3._id];
  await root.save();

  console.log("👉 ৩টা child add হলো");

  // --- Step 2: root এর লেভেল update check ---
  await updateUserLevel(root._id);

  const updatedRoot1 = await User.findById(root._id);
  console.log("✅ Root-এর লেভেল (৩ child add করার পর):", updatedRoot1.level);

  // --- Step 3: প্রত্যেকটা child কে level 1 করবো ---
  child1.level = 1; await child1.save();
  child2.level = 1; await child2.save();
  child3.level = 1; await child3.save();

  console.log("👉 সব child এখন level 1");

  // root কে আবার check করা
  await updateUserLevel(root._id);

  const updatedRoot2 = await User.findById(root._id);
  console.log("✅ Root-এর লেভেল (child গুলো 1 হওয়ার পর):", updatedRoot2.level);

  mongoose.connection.close();
}

// Run Test
runTest();


module.exports = {runTest};