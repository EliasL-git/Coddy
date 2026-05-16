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
  Target,
  Medal,
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
    .replace(/[\"']/g, '"')
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
          check.toLowerCase().replace(/[\"']/g, '"').replace(/\s+/g, " ").trim(),
        ),
    );

    if (missing.length) {
      return {
        valid: false,
        fix:
          "Your code is missing: " +
          missing.map((item) => `\`${item}\``).join(", ") +
          ".",
      };
    }
  }

  return { valid: true, fix: null };
}

function ProgressBar({ total, completed }) {
  const progress = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-muted font-medium min-w-[3rem] text-right">
        {completed}/{total}
      </span>
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
    <div className="rounded-lg border border-border bg-surface p-3 text-sm">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-foreground">{snippet.title}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-surface-hover rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check size={14} className="text-secondary" />
          ) : (
            <Copy size={14} className="text-muted" />
          )}
        </button>
      </div>
      <pre className="text-xs overflow-x-auto rounded bg-background p-2 border border-border max-h-32">
        <code className="text-foreground-light font-mono">{snippet.code}</code>
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
  const [activeTab, setActiveTab] = useState("instructions");
  const [checking, setChecking] = useState(false);

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

        // Locking logic
        if (lesson?.courseId && course) {
          const courseLessons = (course.lessons || []).map((l) => ({
            id: l.id,
            title: l.title,
          }));
          const firstMissingIndex = courseLessons.findIndex(
            (l) => !(user?.completedLessons || []).includes(l.id)
          );
          const currentIndex = courseLessons.findIndex((l) => l.id === lesson.id);
          if (
            firstMissingIndex !== -1 &&
            currentIndex !== -1 &&
            currentIndex > firstMissingIndex
          ) {
            setLockedBy(courseLessons[firstMissingIndex]);
          }
        }

        const language = lesson.language ?? "html";
        const initialCode = user?.siteCode?.[language] || lesson.challenges?.[0]?.starterCode || "";
        setCode(initialCode);
      } catch (error) {
        console.error("Failed to load lesson:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const nextLesson = useMemo(() => {
    if (!course || !lesson) return null;
    const sorted = [...(course.lessons || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const idx = sorted.findIndex((l) => l.id === lesson.id);
    if (idx >= 0 && idx + 1 < sorted.length) return sorted[idx + 1];
    return null;
  }, [course, lesson]);

  const challenge = lesson?.challenges?.[currentIdx];
  const lang = lesson?.language ?? "html";

  const handleCheck = useCallback(async () => {
    if (!challenge || !lesson || checking) return;
    setChecking(true);
    setFeedback(null);

    try {
      const result = await api.check(lesson.id, challenge.id, code);
      if (result.user) updateUser(result.user);
      setFeedback({ valid: result.valid, fix: result.fix, aiPowered: result.aiPowered });
    } catch (error) {
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
    } catch (error) {
      console.error("Failed to complete lesson:", error);
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
      setFeedback(null);
      setHintsOpen(false);
    } else {
      finishLesson();
    }
  }, [currentIdx, lesson, user, finishLesson]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted">Loading lesson workspace...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-muted">Lesson not found.</p>
        <Link to="/" className="text-primary font-medium hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Trophy size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Chapter Complete!
          </h2>
          <p className="text-muted mb-6">
            Great job! You've completed {lesson.title} and earned rewards.
          </p>

          {courseCompleted && (
            <div className="mb-6 rounded-xl border border-secondary bg-secondary/5 p-4">
              <div className="flex items-center justify-center gap-2 text-secondary font-semibold">
                <Medal size={20} />
                <span>Course Completed!</span>
              </div>
              <p className="text-sm text-muted mt-1">
                You've mastered {course?.title || "this project"}.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-8 my-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">+{earnedXp}</div>
              <div className="text-xs text-muted uppercase tracking-wide">XP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">+{earnedCoins}</div>
              <div className="text-xs text-muted uppercase tracking-wide">Coins</div>
            </div>
          </div>

          {newAchievements.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">
                New Achievements
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {newAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-sm"
                  >
                    <span className="text-lg">{achievement.icon}</span>
                    <span className="font-medium text-foreground">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {nextLesson ? (
              <Link
                to={`/learn/${nextLesson.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-foreground font-semibold px-5 py-2.5 transition-colors"
              >
                Next Chapter
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to={`/learn/${course?.id || lesson.courseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-foreground font-semibold px-5 py-2.5 transition-colors"
              >
                Back to Course
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-start: textbook/frontmatter phase
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
          <Link
            to={`/learn/${lesson.courseId || lesson.language}`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
            Back to course
          </Link>
          <h1 className="font-bold text-foreground">{lesson.title}</h1>
          <div className="w-16" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <article className="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
            {lesson.content && (
              <div
                className="prose prose-slate max-w-none mb-10 text-foreground"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(lesson.content || "")),
                }}
              />
            )}

            {lesson.examples && lesson.examples.length > 0 && (
              <section className="mb-10 border-t border-border pt-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Code Snippets
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {lesson.examples.map((example, idx) => (
                    <CodeSnippet key={idx} snippet={example} />
                  ))}
                </div>
              </section>
            )}

            {lockedBy ? (
              <div className="rounded-xl border border-warning/50 bg-warning/5 p-4 text-sm text-warning">
                This chapter is locked. Complete the earlier chapter first:
                <div className="mt-2">
                  <Link
                    to={`/learn/${lockedBy.id}`}
                    className="font-semibold underline hover:text-warning/80"
                  >
                    {lockedBy.title}
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartClick}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
              >
                <Code2 size={20} />
                Start Coding
              </button>
            )}
          </article>
        </main>
      </div>
    );
  }

  // Active coding view
  const challenges = lesson.challenges ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3 text-sm">
          <Link
            to={`/learn/${lesson.courseId || lesson.language}`}
            className="flex items-center gap-1 text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back to project</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <BookOpen size={16} className="text-muted" />
            <span className="font-medium text-foreground truncate">
              {course?.title || lesson.courseId || "Project"}
            </span>
            <span className="text-muted">/</span>
            <span className="text-muted truncate">{lesson.title}</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-muted text-xs">
            <span className="flex items-center gap-1">
              <Target size={14} />
              Task {currentIdx + 1} of {challenges.length}
            </span>
            <div className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1 text-warning font-semibold">
              <Zap size={14} />
              {lesson.xpReward} XP
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
              {lang.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="sm:hidden shrink-0 flex border-b border-border bg-surface">
        {[
          { key: "instructions", icon: <BookOpen size={16} />, label: "Task" },
          { key: "editor", icon: <Code2 size={16} />, label: "Code" },
          { key: "preview", icon: <Monitor size={16} />, label: "Preview" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Instructions Sidebar */}
        <aside
          className={`hidden sm:flex flex-col w-80 xl:w-96 shrink-0 overflow-y-auto border-r border-border bg-surface p-5 ${
            activeTab === "instructions" ? "flex sm:flex" : "hidden"
          }`}
        >
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Progress
            </div>
            <ProgressBar total={challenges.length} completed={currentIdx} />
          </div>

          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Current Task
            </span>
            <h2 className="text-lg font-bold text-foreground mt-1">
              {challenge?.title}
            </h2>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-foreground-light mb-5">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(challenge?.description || "")),
              }}
            />
          </div>

          <div className="rounded-lg border border-border bg-background p-4 mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
              📝 Your Task
            </p>
            <div
              className="text-sm text-foreground"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(challenge?.instructions || "")),
              }}
            />
          </div>

          {challenge?.hints?.length > 0 && (
            <div className="mb-5">
              <button
                onClick={() => setHintsOpen((open) => !open)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark mb-2"
              >
                <Lightbulb size={16} />
                {hintsOpen ? "Hide Tips" : "Show Tips"}
              </button>
              {hintsOpen && (
                <ul className="space-y-2 text-sm text-foreground-light">
                  {challenge.hints.map((hint, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <span className="text-primary shrink-0">💡</span>
                      <code className="font-mono text-xs bg-background px-2 py-1 rounded border border-border">
                        {hint}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {lesson.examples && lesson.examples.length > 0 && (
            <div className="mt-auto pt-4 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">
                Code Snippets
              </p>
              <div className="space-y-2">
                {lesson.examples.map((example, idx) => (
                  <CodeSnippet key={idx} snippet={example} />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            activeTab !== "instructions" ? "flex sm:flex" : "hidden sm:flex"
          }`}
        >
          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0 flex items-center gap-2 bg-surface border-b border-border px-3 py-1.5 text-xs text-muted">
              <Code2 size={14} />
              <span>editor</span>
              <div className="ml-auto text-xs text-muted hidden sm:block">
                {lang}
              </div>
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
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-muted text-sm">
                    Loading editor...
                  </div>
                }
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-border">
            <div className="shrink-0 flex items-center gap-2 bg-surface px-3 py-1.5 text-xs text-muted border-b border-border">
              <Monitor size={14} />
              <span>{isJs ? "console output" : "live preview"}</span>
              {isJs && (
                <button
                  onClick={() => {
                    setCodeToRun(code);
                    setRunKey((k) => k + 1);
                  }}
                  className="ml-auto flex items-center gap-1 bg-secondary hover:bg-secondary-dark text-white px-2 py-0.5 rounded text-xs font-medium transition-colors"
                >
                  <Play size={10} fill="currentColor" />
                  Run
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
        </div>
      </div>

      {/* Bottom Panel: Chat, Feedback, Actions */}
      <div className="shrink-0 border-t border-border bg-surface px-4 py-3 space-y-3">
        <BitsyChat lesson={lesson} challenge={challenge} code={code} language={lang} />
        {(feedback || checking) && <BitsyGrader feedback={feedback} isChecking={checking} />}
      </div>

      {/* Action Bar */}
      {!feedback?.valid && (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {checking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>Check Answer</>
            )}
          </button>
        </div>
      )}

      {feedback?.valid && (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-3 flex items-center gap-3">
          <div className="flex-1" />
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 text-secondary hover:text-secondary-dark font-semibold text-sm bg-secondary/10 hover:bg-secondary/20 px-4 py-2 rounded-lg transition-colors"
          >
            {currentIdx + 1 < challenges.length ? "Next Task" : "Complete Lesson"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
