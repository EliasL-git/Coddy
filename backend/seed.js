require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');
const { loadLessons } = require('./services/courseLoader');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coddy');
  await Lesson.deleteMany({});
  const lessons = loadLessons();
  await Lesson.insertMany(lessons);
  console.log(`Seeded ${lessons.length} lessons!`);
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
