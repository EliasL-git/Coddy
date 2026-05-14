const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  icon: String,
  earnedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    completedLessons: [{ type: String }],
    completedCourses: [{ type: String }],
    achievements: [achievementSchema],
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
