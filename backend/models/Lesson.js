const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ['code', 'quiz', 'fill'], default: 'code' },
  title: String,
  description: String,
  instructions: String,
  starterCode: String,
  expectedOutput: String,
  hints: [String],
  xpReward: { type: Number, default: 10 }
});

const lessonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  language: { type: String, enum: ['html', 'css', 'javascript'], required: true },
  title: String,
  description: String,
  order: { type: Number, default: 0 },
  unit: { type: String, default: 'Basics' },
  courseId: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  challenges: [challengeSchema],
  xpReward: { type: Number, default: 20 },
  prerequisites: [{ type: String }]
});

module.exports = mongoose.model('Lesson', lessonSchema);
