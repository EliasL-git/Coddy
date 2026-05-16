const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(__dirname, "../../lessons");

const VALID_CHALLENGE_TYPES = ["code", "quiz", "fill"];
const VALID_LANGUAGES = ["html", "css", "javascript"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const PROJECT_SCAFFOLD_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>My Portfolio</title>
</head>
<body>
</body>
</html>`;

const PROJECT_SCAFFOLD_CSS = ``;

const PROJECT_SCAFFOLD_JS = ``;

function readJson(filePath, displayName) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`${displayName}: ${err.message}`);
  }
}

function inferChapterLanguage(chapter, index) {
  const text = `${chapter.id || ""} ${chapter.title || ""} ${chapter.summary || ""}`.toLowerCase();

  if (chapter.restrictions?.noCss && chapter.restrictions?.noJs) return "html";
  if (chapter.restrictions?.noJs && !chapter.restrictions?.noCss) return "css";
  if (text.includes("deployment")) return "javascript";
  if (text.includes("javascript") || text.includes("interactiv")) return "javascript";
  if (text.includes("css")) return "css";
  if (text.includes("html")) return "html";

  return ["html", "css", "javascript"][index] || "javascript";
}

function buildStarterCode(language) {
  if (language === "html") return PROJECT_SCAFFOLD_HTML.trim();
  if (language === "css") return PROJECT_SCAFFOLD_CSS;
  return PROJECT_SCAFFOLD_JS;
}

function buildChecks(chapter, task, language) {
  const title = `${chapter.title || ""} ${task.title || ""}`.toLowerCase();

  if (language === "html") {
    if (title.includes("navbar")) return ["<nav", "href="];
    if (title.includes("about")) return ["<section", "about"];
    if (title.includes("project")) return ["<section", "projects", "<article"];
    if (title.includes("contact")) return ["<form", "<input", "<textarea"];
  }

  if (language === "css") {
    if (title.includes("navbar")) return ["display: flex", "justify-content: space-between"];
    if (title.includes("project")) return ["grid-template-columns", "gap:"];
    if (title.includes("button")) return ["button", ":hover"];
  }

  if (language === "javascript") {
    if (title.includes("dark mode")) return ["localStorage", "classList.toggle"];
    if (title.includes("menu")) return ["addEventListener", "classList.toggle"];
    if (title.includes("validation")) return ["preventDefault", "querySelector"];
  }

  return chapter.learningGoals || [];
}

function buildTaskChallenge(chapter, task, language, chapterIndex, taskIndex) {
  return {
    id: task.id || `task-${chapterIndex + 1}-${taskIndex + 1}`,
    type: "code",
    title: task.title,
    description: task.instructions,
    instructions: task.instructions,
    starterCode: buildStarterCode(language),
    baseHtml: language === "html" ? "" : PROJECT_SCAFFOLD_HTML.trim(),
    baseCss:
      language === "javascript" || language === "css"
        ? PROJECT_SCAFFOLD_CSS.trim()
        : "",
    hints: chapter.hints || [],
    checks: buildChecks(chapter, task, language),
    xpReward: 10,
  };
}

function loadProjectCourse(filePath, displayName) {
  const courseMeta = readJson(filePath, displayName);
  if (!courseMeta.id || !courseMeta.title || !Array.isArray(courseMeta.chapters)) {
    throw new Error(`${displayName}: invalid project course shape`);
  }

  const courseDir = path.dirname(filePath);
  const chapterFiles = courseMeta.chapters.map((chapterRef, index) => {
    const chapterPath = path.join(courseDir, chapterRef);
    const chapterName = `${displayName} › ${chapterRef}`;
    return { chapter: readJson(chapterPath, chapterName), index };
  });

  const lessons = chapterFiles.map(({ chapter, index }) => {
    const language = inferChapterLanguage(chapter, index);
    const challenges = (chapter.tasks || []).map((task, taskIndex) =>
      buildTaskChallenge(chapter, task, language, index, taskIndex),
    );

    return {
      id: chapter.id,
      courseId: courseMeta.id,
      language,
      title: chapter.title,
      description: chapter.summary,
      order: index + 1,
      unit: courseMeta.title,
      difficulty: chapter.difficulty || courseMeta.difficulty || "beginner",
      prerequisites: chapter.prerequisites || [],
      xpReward: Math.max(challenges.length * 10, 10),
      content: chapter.content || "",
      examples: chapter.examples || [],
      challenges,
    };
  });

  return {
    id: courseMeta.id,
    name: courseMeta.title,
    title: courseMeta.title,
    description: courseMeta.description,
    version: courseMeta.version || "0.2",
    icon: courseMeta.icon || "🧭",
    lessons: lessons.map(({ challenges, ...lesson }) => lesson),
  };
}

function loadLegacyCourse(filePath, displayName) {
  const course = readJson(filePath, displayName);
  const errors = [];

  if (!course.id) errors.push(`${displayName}: missing course.id`);
  if (!course.name) errors.push(`${displayName}: missing course.name`);
  if (!course.description) errors.push(`${displayName}: missing course.description`);
  if (!Array.isArray(course.lessons)) errors.push(`${displayName}: lessons must be an array`);

  if (course.difficulty && !VALID_DIFFICULTIES.includes(course.difficulty)) {
    errors.push(`${displayName}: invalid difficulty "${course.difficulty}"`);
  }

  if (errors.length) {
    throw new Error(errors[0]);
  }

  return course;
}

const courseCache = { courses: null, lessons: null };

function getCourseFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`lessons/ directory not found at ${CONTENT_DIR}`);
  }

  const result = [];

  const entries = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const dirPath = path.join(CONTENT_DIR, entry.name);
    const courseFile = path.join(dirPath, "course.json");
    if (fs.existsSync(courseFile)) {
      result.push({ filePath: courseFile, displayName: `${entry.name}/course.json`, project: true });
      continue;
    }

    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"))
      .sort();

    for (const file of files) {
      result.push({
        filePath: path.join(dirPath, file),
        displayName: `${entry.name}/${file}`,
        project: false,
      });
    }
  }

  return result;
}

function loadCourses() {
  const courses = [];
  const errors = [];

  for (const { filePath, displayName, project } of getCourseFiles()) {
    try {
      courses.push(
        project ? loadProjectCourse(filePath, displayName) : loadLegacyCourse(filePath, displayName),
      );
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length) {
    console.error("Course validation errors:");
    errors.forEach((error) => console.error("  -", error));
  }

  courseCache.courses = courses;
  return courses;
}

function loadAllLessonsWithChallenges() {
  const lessons = [];
  
  for (const { filePath, displayName, project } of getCourseFiles()) {
    try {
      if (!project) continue; // Skip legacy courses for now
      
      const courseMeta = readJson(filePath, displayName);
      const courseDir = path.dirname(filePath);
      
      const chapterFiles = courseMeta.chapters.map((chapterRef, index) => {
        const chapterPath = path.join(courseDir, chapterRef);
        const chapterName = `${displayName} › ${chapterRef}`;
        return { chapter: readJson(chapterPath, chapterName), index };
      });

      chapterFiles.forEach(({ chapter, index }) => {
        const language = inferChapterLanguage(chapter, index);
        const challenges = (chapter.tasks || []).map((task, taskIndex) =>
          buildTaskChallenge(chapter, task, language, index, taskIndex),
        );

        lessons.push({
          id: chapter.id,
          courseId: courseMeta.id,
          language,
          title: chapter.title,
          description: chapter.summary,
          order: index + 1,
          unit: courseMeta.title,
          difficulty: chapter.difficulty || courseMeta.difficulty || "beginner",
          prerequisites: chapter.prerequisites || [],
          xpReward: Math.max(challenges.length * 10, 10),
          content: chapter.content || "",
          examples: chapter.examples || [],
          challenges,
        });
      });
    } catch (err) {
      // Skip courses with errors
    }
  }
  
  return lessons;
}

function loadLessons() {
  // Use cached lessons if available, otherwise rebuild from raw course data
  if (courseCache.lessons) {
    return courseCache.lessons;
  }
  
  const lessons = loadAllLessonsWithChallenges();
  courseCache.lessons = lessons;
  return lessons;
}

module.exports = {
  loadCourses,
  loadLessons,
  validateCourse: loadLegacyCourse,
  VALID_CHALLENGE_TYPES,
  VALID_LANGUAGES,
  VALID_DIFFICULTIES,
};
