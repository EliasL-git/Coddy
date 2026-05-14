// Validates all JSON files in the lessons/ folder and prints a summary.
// Run with: npm run validate
const { loadLessons, loadCourses } = require("./services/courseLoader");

try {
  const courses = loadCourses();
  const lessons = loadLessons();

  console.log(`✓ ${courses.length} course(s) loaded:`);
  for (const course of courses) {
    const count = lessons.filter((l) => l.courseId === course.id).length;
    console.log(
      `   ${course.icon || "📚"}  ${course.name} — ${count} lesson(s)`,
    );
  }
  console.log(`\n✓ ${lessons.length} total lesson(s) — all valid.`);
} catch (err) {
  console.error("✗", err.message);
  process.exit(1);
}
