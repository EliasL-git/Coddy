const fs = require("fs");
const path = require("path");

// Project-root lessons/ folder.
// Structure: lessons/<language>/<course>.json
// Add a new language by creating a new subfolder.
const LESSONS_DIR = path.join(__dirname, "../../lessons");

const VALID_CHALLENGE_TYPES = ["code", "quiz", "fill"];
const VALID_LANGUAGES = ["html", "css", "javascript"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateCourse(course, displayName) {
  const errors = [];

  if (!course.id) errors.push(`${displayName}: missing course.id`);
  if (!course.name) errors.push(`${displayName}: missing course.name`);
  if (!course.description)
    errors.push(`${displayName}: missing course.description`);
  if (!Array.isArray(course.lessons))
    errors.push(`${displayName}: lessons must be an array`);

  if (course.difficulty && !VALID_DIFFICULTIES.includes(course.difficulty))
    errors.push(`${displayName}: invalid difficulty "${course.difficulty}"`);

  if (Array.isArray(course.lessons)) {
    course.lessons.forEach((lesson, i) => {
      const p = `${displayName} › lesson[${i}]`;
      if (!lesson.id) errors.push(`${p}: missing id`);
      if (!lesson.title) errors.push(`${p}: missing title`);
      if (!lesson.language || !VALID_LANGUAGES.includes(lesson.language))
        errors.push(`${p}: invalid language "${lesson.language}"`);
      if (!Array.isArray(lesson.challenges))
        errors.push(`${p}: challenges must be an array`);
      if (lesson.difficulty && !VALID_DIFFICULTIES.includes(lesson.difficulty))
        errors.push(`${p}: invalid difficulty "${lesson.difficulty}"`);

      if (Array.isArray(lesson.challenges)) {
        lesson.challenges.forEach((ch, ci) => {
          const cp = `${p} › challenge[${ci}]`;
          if (!ch.id) errors.push(`${cp}: missing id`);
          if (!ch.title) errors.push(`${cp}: missing title`);
          if (!ch.type || !VALID_CHALLENGE_TYPES.includes(ch.type))
            errors.push(`${cp}: invalid type "${ch.type}"`);
        });
      }
    });
  }

  return errors;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Walk lessons/<lang>/<course>.json and return
 * [{ filePath, displayName }] sorted by lang then filename.
 */
function getCourseFiles() {
  if (!fs.existsSync(LESSONS_DIR))
    throw new Error(`lessons/ directory not found at ${LESSONS_DIR}`);

  const result = [];

  const langDirs = fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of langDirs) {
    const dirPath = path.join(LESSONS_DIR, dir.name);
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      result.push({
        filePath: path.join(dirPath, file),
        displayName: `${dir.name}/${file}`,
      });
    }
  }

  return result;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function loadCourses() {
  const courses = [];
  const errors = [];

  for (const { filePath, displayName } of getCourseFiles()) {
    try {
      const course = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const errs = validateCourse(course, displayName);
      if (errs.length) {
        errors.push(...errs);
        continue;
      }
      courses.push(course);
    } catch (err) {
      errors.push(`${displayName}: ${err.message}`);
    }
  }

  if (errors.length) {
    console.error("Course validation errors:");
    errors.forEach((e) => console.error("  -", e));
    throw new Error(`Failed to load courses — ${errors.length} error(s) above`);
  }

  return courses;
}

/** Flat list of all lessons, each with courseId injected. */
function loadLessons() {
  const lessons = [];
  for (const course of loadCourses()) {
    for (const lesson of course.lessons) {
      lessons.push({
        ...lesson,
        courseId: course.id,
        difficulty: lesson.difficulty || course.difficulty || "beginner",
      });
    }
  }
  return lessons;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  loadCourses,
  loadLessons,
  validateCourse,
  VALID_CHALLENGE_TYPES,
  VALID_LANGUAGES,
  VALID_DIFFICULTIES,
};
