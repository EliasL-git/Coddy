const fs = require('fs');
const path = require('path');

const COURSES_DIR = path.join(__dirname, '../courses');

const VALID_CHALLENGE_TYPES = ['code', 'quiz', 'fill'];
const VALID_LANGUAGES = ['html', 'css', 'javascript'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

function validateCourse(course, filename) {
  const errors = [];

  if (!course.id) errors.push(`${filename}: missing course.id`);
  if (!course.name) errors.push(`${filename}: missing course.name`);
  if (!course.description) errors.push(`${filename}: missing course.description`);
  if (!Array.isArray(course.lessons)) errors.push(`${filename}: lessons must be an array`);

  if (course.difficulty && !VALID_DIFFICULTIES.includes(course.difficulty)) {
    errors.push(`${filename}: invalid difficulty "${course.difficulty}"`);
  }

  if (Array.isArray(course.lessons)) {
    course.lessons.forEach((lesson, i) => {
      if (!lesson.id) errors.push(`${filename}: lesson[${i}] missing id`);
      if (!lesson.language || !VALID_LANGUAGES.includes(lesson.language)) {
        errors.push(`${filename}: lesson[${i}] invalid language "${lesson.language}"`);
      }
      if (!lesson.title) errors.push(`${filename}: lesson[${i}] missing title`);
      if (!Array.isArray(lesson.challenges)) {
        errors.push(`${filename}: lesson[${i}] challenges must be an array`);
      }
      if (lesson.difficulty && !VALID_DIFFICULTIES.includes(lesson.difficulty)) {
        errors.push(`${filename}: lesson[${i}] invalid difficulty "${lesson.difficulty}"`);
      }

      if (Array.isArray(lesson.challenges)) {
        lesson.challenges.forEach((ch, ci) => {
          if (!ch.id) errors.push(`${filename}: lesson[${i}].challenge[${ci}] missing id`);
          if (!ch.type || !VALID_CHALLENGE_TYPES.includes(ch.type)) {
            errors.push(`${filename}: lesson[${i}].challenge[${ci}] invalid type "${ch.type}"`);
          }
          if (!ch.title) errors.push(`${filename}: lesson[${i}].challenge[${ci}] missing title`);
          if (ch.expectedOutput === undefined && ch.type === 'code') {
            errors.push(`${filename}: lesson[${i}].challenge[${ci}] missing expectedOutput`);
          }
        });
      }
    });
  }

  return errors;
}

function loadCourses() {
  const courses = [];
  const errors = [];

  if (!fs.existsSync(COURSES_DIR)) {
    throw new Error(`Courses directory not found: ${COURSES_DIR}`);
  }

  const files = fs.readdirSync(COURSES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .sort();

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(COURSES_DIR, file), 'utf8');
      const course = JSON.parse(raw);
      const validationErrors = validateCourse(course, file);
      if (validationErrors.length) {
        errors.push(...validationErrors);
        continue;
      }
      courses.push(course);
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
    }
  }

  if (errors.length) {
    console.error('Course validation errors:');
    errors.forEach(e => console.error('  -', e));
    throw new Error(`Failed to load ${errors.length} course(s) with errors`);
  }

  return courses;
}

function loadLessons() {
  const courses = loadCourses();
  const lessons = [];

  for (const course of courses) {
    for (const lesson of course.lessons) {
      lessons.push({
        ...lesson,
        courseId: course.id,
        difficulty: lesson.difficulty || course.difficulty || 'beginner'
      });
    }
  }

  return lessons;
}

function loadCourseManifest() {
  const manifestPath = path.join(COURSES_DIR, 'index.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Course manifest (index.json) not found');
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

module.exports = {
  loadCourses,
  loadLessons,
  loadCourseManifest,
  validateCourse,
  VALID_CHALLENGE_TYPES,
  VALID_LANGUAGES,
  VALID_DIFFICULTIES
};
