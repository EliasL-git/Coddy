const express = require('express');
const Prize = require('../models/Prize');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/prizes
// Returns all active prizes sorted by coinCost ascending.
router.get('/', async (req, res) => {
  try {
    const prizes = await Prize.find({ active: true }).sort({ coinCost: 1 });
    res.json(prizes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/prizes/redeem/:prizeId  (auth required)
// Deducts coins from user and creates a Redemption document.
router.post('/redeem/:prizeId', auth, async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.prizeId);
    if (!prize || !prize.active)
      return res.status(404).json({ message: 'Prize not found' });

    if (prize.stock === 0)
      return res.status(400).json({ message: 'Out of stock' });

    const user = await User.findById(req.userId);
    if (user.coins < prize.coinCost)
      return res.status(400).json({ message: 'Not enough coins' });

    // Deduct coins
    user.coins -= prize.coinCost;

    // Decrement stock if limited
    if (prize.stock !== -1) prize.stock -= 1;

    // Create redemption record (snapshot prize name & cost)
    const redemption = new Redemption({
      userId: user._id,
      prizeId: prize._id,
      prizeName: prize.name,
      coinCost: prize.coinCost,
    });

    await Promise.all([user.save(), prize.save(), redemption.save()]);

    res.json({ message: 'Redeemed!', coins: user.coins, redemption });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prizes/redemptions  (auth required)
// Returns the authenticated user's redemptions, newest first.
router.get('/redemptions', auth, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ userId: req.userId })
      .populate('prizeId')
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
