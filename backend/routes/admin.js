const express = require("express");
const User = require("../models/User");
const Prize = require("../models/Prize");
const Redemption = require("../models/Redemption");
const adminAuth = require("../middleware/adminAuth");
const { loadLessons } = require("../services/courseLoader");
const router = express.Router();

// All routes in this file require admin authentication
router.use(adminAuth);

// ─── Stats ────────────────────────────────────────────────────────────────────

// GET /api/admin/stats
// Returns: { totalUsers, totalLessons, totalXP, totalCoinsAwarded, usersByRole }
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, xpAgg, coinsAgg, roleAgg] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: null, totalXP: { $sum: "$xp" } } }]),
      User.aggregate([
        { $group: { _id: null, totalCoins: { $sum: "$coins" } } },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

    const totalLessons = loadLessons().length;
    const totalXP = xpAgg.length > 0 ? xpAgg[0].totalXP : 0;
    const totalCoinsAwarded = coinsAgg.length > 0 ? coinsAgg[0].totalCoins : 0;

    const usersByRole = { admin: 0, user: 0 };
    for (const entry of roleAgg) {
      if (entry._id === "admin") usersByRole.admin = entry.count;
      else if (entry._id === "user") usersByRole.user = entry.count;
    }

    res.json({
      totalUsers,
      totalLessons,
      totalXP,
      totalCoinsAwarded,
      usersByRole,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users?search=
// Returns all users minus password. Optional regex search on username or email.
router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id
// Partially update a user. Allowed fields: role, xp, streak, coins.
router.patch("/users/:id", async (req, res) => {
  try {
    const ALLOWED = ["role", "xp", "streak", "coins"];
    const updates = {};
    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Lessons ──────────────────────────────────────────────────────────────────

// GET /api/admin/lessons
// Returns all lessons from JSON files, sorted by language then order.
router.get("/lessons", (req, res) => {
  try {
    const lessons = loadLessons().sort(
      (a, b) =>
        a.language.localeCompare(b.language) || (a.order || 0) - (b.order || 0),
    );
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lessons are managed via JSON files only (lessons/<lang>/<course>.json).

// ─── Prizes ───────────────────────────────────────────────────────────────────

// GET /api/admin/prizes
// Returns all prizes (including inactive), sorted by createdAt descending.
router.get("/prizes", async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ createdAt: -1 });
    res.json(prizes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/prizes
// Create a new prize.
router.post("/prizes", async (req, res) => {
  try {
    const { name, description, emoji, coinCost, stock, active } = req.body;
    const prize = new Prize({
      name,
      description,
      emoji,
      coinCost,
      stock,
      active,
    });
    await prize.save();
    res.status(201).json(prize);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/prizes/:id
// Replace/update a prize.
router.put("/prizes/:id", async (req, res) => {
  try {
    const { name, description, emoji, coinCost, stock, active } = req.body;
    const prize = await Prize.findByIdAndUpdate(
      req.params.id,
      { name, description, emoji, coinCost, stock, active },
      { new: true, runValidators: true },
    );
    if (!prize) return res.status(404).json({ message: "Prize not found" });
    res.json(prize);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/prizes/:id
router.delete("/prizes/:id", async (req, res) => {
  try {
    const prize = await Prize.findByIdAndDelete(req.params.id);
    if (!prize) return res.status(404).json({ message: "Prize not found" });
    res.json({ message: "Prize deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Redemptions ──────────────────────────────────────────────────────────────

// GET /api/admin/redemptions
// Returns all redemptions with user info and prize info, newest first.
router.get("/redemptions", async (req, res) => {
  try {
    const redemptions = await Redemption.find()
      .populate("userId", "username email")
      .populate("prizeId")
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/redemptions/:id
// Update status and/or adminNote on a redemption.
router.patch("/redemptions/:id", async (req, res) => {
  try {
    const ALLOWED = ["status", "adminNote"];
    const updates = {};
    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const redemption = await Redemption.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate("userId", "username email")
      .populate("prizeId");

    if (!redemption)
      return res.status(404).json({ message: "Redemption not found" });
    res.json(redemption);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
