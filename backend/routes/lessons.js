const express = require("express");
const path = require("path");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { loadLessons, loadCourses } = require("../services/courseLoader");
const router = express.Router();

// GET /api/lessons/courses?language=html
router.get("/courses", (req, res) => {
  try {
    let courses = loadCourses();
    if (req.query.language) {
      courses = courses.filter((c) =>
        c.lessons.some((l) => l.language === req.query.language),
      );
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/lessons[?language=html|css|javascript]
router.get("/", (req, res) => {
  try {
    let lessons = loadLessons();
    if (req.query.language)
      lessons = lessons.filter((l) => l.language === req.query.language);
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/lessons/:id
router.get("/:id", (req, res) => {
  try {
    const lesson = loadLessons().find((l) => l.id === req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/lessons/:id/complete
router.post("/:id/complete", auth, async (req, res) => {
  try {
    const config = require(path.join(__dirname, "../../config/rewards.json"));
    const user = await User.findById(req.userId);
    const lesson = loadLessons().find((l) => l.id === req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Enforce course order: use the course definition order (as authored)
    // to determine earlier lessons. This avoids relying on numeric `order`
    // fields which may be missing or inconsistent.
    if (lesson.courseId) {
      const courses = loadCourses();
      const course = courses.find((c) => c.id === lesson.courseId);
      if (course && Array.isArray(course.lessons)) {
        const lessonIds = course.lessons.map((l) => l.id);
        const idx = lessonIds.indexOf(lesson.id);
        if (idx > 0) {
          const earlierIds = lessonIds.slice(0, idx);
          const missing = earlierIds.filter((lid) => !user.completedLessons.includes(lid));
          if (missing.length) {
            return res.status(403).json({ message: "Complete earlier chapters in the course first." });
          }
        }
      }
    }

    const alreadyCompleted = user.completedLessons.includes(req.params.id);

    if (!alreadyCompleted) {
      user.completedLessons.push(req.params.id);
      user.xp += lesson.xpReward || 0;
      user.coins +=
        lesson.coinsReward != null
          ? lesson.coinsReward
          : config.coins.perLessonDefault;
    }

    // ── Course completion check ──────────────────────────────────────────────
    let courseJustCompleted = null;
    if (!alreadyCompleted && lesson.courseId) {
      const courseLessons = loadLessons().filter(
        (l) => l.courseId === lesson.courseId,
      );
      const allDone = courseLessons.every((l) =>
        user.completedLessons.includes(l.id),
      );
      if (allDone && !user.completedCourses.includes(lesson.courseId)) {
        user.completedCourses.push(lesson.courseId);
        user.coins += config.coins.courseCompletionBonus;
        courseJustCompleted = lesson.courseId;
      }
    }

    // ── Streak ───────────────────────────────────────────────────────────────
    const now = new Date();
    const last = new Date(user.lastActive);
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) user.streak += 1;
    else if (diffDays > 1) user.streak = 1;
    user.lastActive = now;

    // ── Achievements ─────────────────────────────────────────────────────────
    const newAchievements = [];
    if (user.xp >= 100 && !user.achievements.find((a) => a.id === "first_100"))
      newAchievements.push({
        id: "first_100",
        name: "Centurion",
        description: "Earn 100 XP",
        icon: "🎯",
      });
    if (
      user.completedLessons.length >= 1 &&
      !user.achievements.find((a) => a.id === "first_lesson")
    )
      newAchievements.push({
        id: "first_lesson",
        name: "Hello World",
        description: "Complete your first lesson",
        icon: "👋",
      });
    if (
      user.completedLessons.length >= 5 &&
      !user.achievements.find((a) => a.id === "five_lessons")
    )
      newAchievements.push({
        id: "five_lessons",
        name: "Getting Warm",
        description: "Complete 5 lessons",
        icon: "🔥",
      });
    if (user.streak >= 3 && !user.achievements.find((a) => a.id === "streak_3"))
      newAchievements.push({
        id: "streak_3",
        name: "On Fire",
        description: "3 day streak",
        icon: "⚡",
      });
    if (newAchievements.length) user.achievements.push(...newAchievements);

    await user.save();

    res.json({
      xp: user.xp,
      coins: user.coins,
      streak: user.streak,
      completedLessons: user.completedLessons,
      completedCourses: user.completedCourses,
      achievements: user.achievements,
      newAchievements,
      courseJustCompleted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
