const express = require('express');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { language } = req.query;
    const query = language ? { language } : {};
    const lessons = await Lesson.find(query).sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ id: req.params.id });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/complete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const lesson = await Lesson.findOne({ id: req.params.id });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (!user.completedLessons.includes(req.params.id)) {
      user.completedLessons.push(req.params.id);
      user.xp += lesson.xpReward;
    }

    // Update streak
    const now = new Date();
    const last = new Date(user.lastActive);
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) user.streak += 1;
    else if (diffDays > 1) user.streak = 1;
    user.lastActive = now;

    // Achievements
    const newAchievements = [];
    if (user.xp >= 100 && !user.achievements.find(a => a.id === 'first_100')) {
      newAchievements.push({ id: 'first_100', name: 'Centurion', description: 'Earn 100 XP', icon: '🎯' });
    }
    if (user.completedLessons.length >= 1 && !user.achievements.find(a => a.id === 'first_lesson')) {
      newAchievements.push({ id: 'first_lesson', name: 'Hello World', description: 'Complete your first lesson', icon: '👋' });
    }
    if (user.completedLessons.length >= 5 && !user.achievements.find(a => a.id === 'five_lessons')) {
      newAchievements.push({ id: 'five_lessons', name: 'Getting Warm', description: 'Complete 5 lessons', icon: '🔥' });
    }
    if (user.streak >= 3 && !user.achievements.find(a => a.id === 'streak_3')) {
      newAchievements.push({ id: 'streak_3', name: 'On Fire', description: '3 day streak', icon: '⚡' });
    }
    if (newAchievements.length) {
      user.achievements.push(...newAchievements);
    }

    await user.save();
    res.json({ xp: user.xp, streak: user.streak, completedLessons: user.completedLessons, achievements: user.achievements, newAchievements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
