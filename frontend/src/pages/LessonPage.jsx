import { useEffect, useState, useCallback, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useParams, useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import LivePreview from "../components/LivePreview";
import BitsyGrader from "../components/BitsyGrader";
import BitsyChat from "../components/BitsyChat";
import {
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Trophy,
  Zap,
  Play,
  ChevronLeft,
  BookOpen,
  Monitor,
  Code2,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

const MONACO_LANG = { html: "html", css: "css", javascript: "javascript" };

const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
  minimap: { enabled: false },
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  insertSpaces: true,
  renderLineHighlight: "all",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
};

function localValidate(code, challenge) {
  const norm = code
    .toLowerCase()
    .replace(/["']/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (!norm) {
    return {
      valid: false,
      fix: "Add your code above, then press Check Answer.",
    };
  }

  const checks = challenge.checks || [];
  if (checks.length) {
    const missing = checks.filter(
      (check) =>
        !norm.includes(
          check.toLowerCase().replace(/["']/g, '"').replace(/\s+/g, " ").trim(),
        ),
    );

    if (missing.length) {
      return {
        valid: false,
        fix: "Your code is missing: " + missing.map((item) => `\`${item}\``).join(", ") + ".",
      };
    }
  }

  return { valid: true, fix: null };
}

function ProgressDots({ total, current, completed }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i < completed
              ? "w-2 h-2 bg-primary"
              : i === current
                ? "w-3 h-3 bg-primary ring-2 ring-primary/30"
                : "w-2 h-2 bg-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

function CodeSnippet({ snippet }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] p-2 mb-2 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-gray-300">{snippet.title}</span>
        <button
          onClick={handleCopy}
          className="p-0.5 hover:bg-gray-700 rounded transition-colors"
          title="Copy"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="text-[10px] overflow-x-auto bg-[#0d0d0d] rounded p-1 border border-gray-800 max-h-32">
        <code className="text-gray-300">{snippet.code}</code>
      </pre>
    </div>
  );
}

export default function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedBy, setLockedBy] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [courseCompleted, setCourseCompleted] = useState(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [codeToRun, setCodeToRun] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [checking, setChecking] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const lessons = await api.lessons.list();
        const lesson = lessons.find((l) => l.id === id);
        if (!lesson) {
          setLoading(false);
          return;
        }
        setLesson(lesson);

        const courses = await api.lessons.getCourses();
        const course = courses.find((c) => c.id === lesson.courseId);
        setCourse(course);

        // Determine if there are earlier lessons in the course not completed by the user.
        // Only lock the current lesson when there exists a missing lesson that comes
        // before the current one in the authored course order.
        if (lesson?.courseId && course) {
          const courseLessons = (course.lessons || []).map((l) => ({ id: l.id, title: l.title }));
          const firstMissingIndex = courseLessons.findIndex((l) => !(user?.completedLessons || []).includes(l.id));
          const currentIndex = courseLessons.findIndex((l) => l.id === lesson.id);
          if (firstMissingIndex !== -1 && currentIndex !== -1 && currentIndex > firstMissingIndex) {
            setLockedBy(courseLessons[firstMissingIndex]);
          }
        }

        const language = lesson.language ?? "html";
        const initialCode = user?.siteCode?.[language] || lesson.challenges?.[0]?.starterCode || "";
        setCode(initialCode);
      } catch {
        // errors handled by null checks
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const nextLesson = useMemo(() => {
    if (!course || !lesson) return null;
    const sorted = [...(course.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((l) => l.id === lesson.id);
    if (idx >= 0 && idx + 1 < sorted.length) return sorted[idx + 1];
    return null;
  }, [course, lesson]);

  const challenge = lesson?.challenges?.[currentIdx];
  const lang = lesson?.language ?? "html";
  const isJs = lang === "javascript";

  const handleCheck = useCallback(async () => {
    if (!challenge || !lesson || checking) return;
    setChecking(true);
    setFeedback(null);

    try {
      const result = await api.check(lesson.id, challenge.id, code);
      if (result.user) updateUser(result.user);

      setFeedback({ valid: result.valid, fix: result.fix, aiPowered: result.aiPowered });
    } catch {
      const result = localValidate(code, challenge);
      setFeedback({ valid: result.valid, fix: result.fix, aiPowered: false });
    } finally {
      setChecking(false);
    }
  }, [code, challenge, lesson, checking, updateUser]);

  useEffect(() => {
    if (!feedback?.valid) return;
    const timer = setTimeout(handleNext, 1500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleReset = useCallback(() => {
    setCode(challenge?.starterCode ?? "");
    setFeedback(null);
  }, [challenge]);

  const handleStartClick = () => {
    if (lockedBy) {
      // navigate to the first missing chapter
      navigate(`/learn/${lockedBy.id}`);
      return;
    }
    setStarted(true);
  };

  const finishLesson = useCallback(async () => {
    try {
      const data = await api.lessons.complete(id);
      updateUser({
        ...user,
        xp: data.xp,
        coins: data.coins,
        streak: data.streak,
        completedLessons: data.completedLessons,
        completedCourses: data.completedCourses,
        achievements: data.achievements,
      });
      setEarnedXp(lesson?.xpReward ?? 0);
      setEarnedCoins(data.coins - (user?.coins ?? 0));
      setNewAchievements(data.newAchievements ?? []);
      setCourseCompleted(data.courseJustCompleted ?? null);
    } catch {
      // still show completion screen
    }
    setCompleted(true);
  }, [id, lesson, updateUser, user]);

  const handleNext = useCallback(() => {
    const challenges = lesson?.challenges ?? [];
    if (currentIdx + 1 < challenges.length) {
      const nextIdx = currentIdx + 1;
      const next = challenges[nextIdx];
      setCurrentIdx(nextIdx);

      const language = lesson?.language ?? "html";
      setCode(user?.siteCode?.[language] || next.starterCode || "");
      setCodeToRun("");
      setFeedback(null);
      setHintsOpen(false);
      setRunKey(0);
    } else {
      finishLesson();
    }
  }, [currentIdx, lesson, user, finishLesson]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-muted">
        Loading project workspace...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-muted">Lesson not found.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm">
          ← Go back
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Chapter complete! 🎉</h2>
          <p className="text-sm text-muted mb-4">
            Your {course?.title || "project"} is getting better.
          </p>

          {courseCompleted && (
            <div className="mt-2 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm font-semibold text-yellow-800">
              🏆 Entire {course?.title || "project"} completed! Well done.
            </div>
          )}

          <div className="flex justify-center gap-6 my-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-extrabold text-yellow-500">+{earnedXp}</span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Zap size={12} /> XP
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-extrabold text-yellow-600">+{earnedCoins}</span>
              <span className="text-xs text-muted">🪙 coins</span>
            </div>
          </div>

          {newAchievements.length > 0 && (
            <div className="mb-5">
              <p className="font-bold text-sm mb-2">New achievements</p>
              <div className="flex flex-wrap justify-center gap-2">
                {newAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5 text-sm"
                  >
                    {achievement.icon} <span className="font-semibold">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {nextLesson ? (
              <Link
                to={`/learn/${nextLesson.id}`}
                className="bg-background hover:bg-border text-foreground font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                Next chapter
              </Link>
            ) : (
              <Link
                to={`/learn/${course?.id || lesson.courseId}`}
                className="bg-background hover:bg-border text-foreground font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                Back to course
              </Link>
            )}
            <Link
              to="/"
              className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Learning phase - show textbook before starting
  if (!started) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d0d0d] flex flex-col">
        <header className="bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <Link to={`/learn/${lesson.courseId || lesson.language}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft size={16} /> Back
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{lesson.title}</h1>
          <div />
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
            {/* Textbook Content */}
            {lesson.content && (
              <div
                className="prose prose-lg dark:prose-invert max-w-none mb-12 text-slate-900 dark:text-slate-100"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(lesson.content || "")) }}
              />
            )}

            {/* Code Snippets Reference */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="mb-12 border-t border-slate-200 dark:border-slate-800 pt-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Code Snippets You Can Use</h2>
                <div className="space-y-4">
                  {lesson.examples.map((example, idx) => (
                    <CodeSnippet key={idx} snippet={example} />
                  ))}
                </div>
              </div>
            )}

            {/* Start Coding Button */}
            {lockedBy ? (
              <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-4 text-sm text-yellow-800 dark:text-yellow-200">
                This chapter is locked. Complete the earlier chapter first:
                <div className="mt-2">
                  <Link to={`/learn/${lockedBy.id}`} className="font-semibold text-yellow-800 dark:text-yellow-200 underline">
                    {lockedBy.title}
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartClick}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mb-8"
              >
                <Code2 size={18} /> Start Coding
              </button>
            )}
          </article>
        </div>
      </div>
    );
  }

  // Coding phase
  const challenges = lesson.challenges ?? [];

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
      <header className="shrink-0 bg-[#1e1e1e] border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm">
        <Link
          to={`/learn/${lesson.courseId || lesson.language}`}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to project
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-gray-400">
          <BookOpen size={14} />
          <span className="font-semibold text-white">{course?.title || lesson.courseId || "Project"}</span>
          <span className="text-gray-600">·</span>
          <span className="font-medium">{lesson.title}</span>
          <span className="text-gray-600">·</span>
          <span className="text-sm">
            Task {currentIdx + 1} of {challenges.length}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
          <span className="text-yellow-400 font-semibold">⚡ {lesson.xpReward} XP</span>
          <span
            className={`px-2 py-0.5 rounded-full font-semibold ${
              lang === "html"
                ? "bg-orange-900/50 text-orange-300"
                : lang === "css"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-yellow-900/50 text-yellow-300"
            }`}
          >
            {lang.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="shrink-0 flex sm:hidden border-b border-gray-700 bg-[#1e1e1e]">
        {[
          { key: "instructions", icon: <BookOpen size={14} />, label: "Task" },
          { key: "editor", icon: <Code2 size={14} />, label: "Code" },
          { key: "preview", icon: <Monitor size={14} />, label: "Preview" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`
          sm:flex flex-col w-full sm:w-72 xl:w-80 shrink-0
          overflow-y-auto border-r border-gray-700 bg-[#252526] p-5
          ${activeTab === "instructions" ? "flex" : "hidden"}
        `}
        >
          <div className="mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Task {currentIdx + 1} / {challenges.length}
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500 mb-2">
            Improve your project
          </p>
          <h2 className="text-lg font-extrabold text-white mb-2">{challenge?.title}</h2>
          <div className="text-sm text-gray-400 mb-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(challenge?.description || "")) }} />

          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-4 text-sm text-gray-300 mb-4 leading-relaxed">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">📝 Your task</p>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(challenge?.instructions || "")) }} />
          </div>

          {challenge?.hints?.length > 0 && (
            <div>
              <button
                onClick={() => setHintsOpen((value) => !value)}
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium mb-2 transition-colors"
              >
                <Lightbulb size={15} />
                {hintsOpen ? "Hide tips" : "Show tips"}
              </button>
              {hintsOpen && (
                <ul className="space-y-1.5 text-sm text-gray-400">
                  {challenge.hints.map((hint, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-blue-400 shrink-0">💡</span>
                      <code className="font-mono text-xs bg-[#1e1e1e] px-2 py-1 rounded">{hint}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Snippets in sidebar on desktop */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Code Snippets</p>
              <div className="space-y-1">
                {lesson.examples.map((example, idx) => (
                  <CodeSnippet key={idx} snippet={example} />
                ))}
              </div>
            </div>
          )}
        </aside>

        <div
          className={`
          sm:flex flex-1 flex-col overflow-hidden min-w-0
          ${activeTab !== "instructions" ? "flex" : "hidden"}
        `}
        >
          <div
            className={`
            flex-3 min-h-0 overflow-hidden
            ${activeTab === "preview" ? "hidden sm:flex" : "flex"} flex-col
          `}
          >
            <div className="shrink-0 flex items-center gap-2 bg-[#2d2d2d] border-b border-gray-700 px-3 py-1.5 text-xs text-gray-400">
              <Code2 size={12} />
              <span>editor</span>
              <span className="ml-auto text-gray-600">{lang}</span>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                language={MONACO_LANG[lang]}
                value={code}
                onChange={(value) => {
                  setCode(value ?? "");
                  if (feedback && !feedback.valid) setFeedback(null);
                }}
                theme="vs-dark"
                options={EDITOR_OPTIONS}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500 text-sm">
                    Loading editor...
                  </div>
                }
              />
            </div>
          </div>

          <div
            className={`
            flex-2 min-h-0 flex flex-col border-t border-gray-700
            ${activeTab === "editor" ? "hidden sm:flex" : "flex"}
          `}
          >
            <div className="shrink-0 flex items-center gap-2 bg-[#2d2d2d] border-b border-gray-700 px-3 py-1.5 text-xs text-gray-400">
              <Monitor size={12} />
              <span>{isJs ? "console output" : "live preview"}</span>
              {isJs && (
                <button
                  onClick={() => {
                    setCodeToRun(code);
                    setRunKey((value) => value + 1);
                  }}
                  className="ml-auto flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                >
                  <Play size={10} /> Run
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <LivePreview
                code={isJs ? codeToRun : code}
                language={lang}
                baseHtml={challenge?.baseHtml || user?.siteCode?.html}
                baseCss={challenge?.baseCss || user?.siteCode?.css}
                runKey={runKey}
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-700 px-4 py-2 space-y-3">
            <BitsyChat lesson={lesson} challenge={challenge} />

            {(feedback || checking) && <BitsyGrader feedback={feedback} isChecking={checking} />}
          </div>

          {!feedback?.valid && (
            <div className="shrink-0 bg-[#2d2d2d] border-t border-gray-700 px-4 py-2 flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-gray-700"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <div className="flex-1" />
              <button
                onClick={handleCheck}
                disabled={checking}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                {checking ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Checking...
                  </>
                ) : (
                  <>Check Answer</>
                )}
              </button>
            </div>
          )}

          {feedback?.valid && (
            <div className="shrink-0 bg-[#2d2d2d] border-t border-gray-700 px-4 py-2 flex items-center gap-2">
              <div className="flex-1" />
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-sm font-semibold border border-green-800 hover:border-green-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                Skip now <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
