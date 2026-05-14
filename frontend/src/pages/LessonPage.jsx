import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import LivePreview from "../components/LivePreview";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Trophy,
  Zap,
  Play,
  ChevronLeft,
  Coins,
  BookOpen,
  Monitor,
  Code2,
} from "lucide-react";

// ─── Monaco language map ──────────────────────────────────────────────────────

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

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns { passed: bool, missing: string[] }
 * Uses challenge.checks (preferred) or falls back to challenge.expectedOutput.
 * Normalises whitespace and quotes before comparing.
 */
function validate(code, challenge) {
  const norm = code
    .toLowerCase()
    .replace(/['"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  const checks = challenge.checks || [];

  if (checks.length) {
    const missing = checks.filter(
      (c) =>
        !norm.includes(
          c.toLowerCase().replace(/['"]/g, '"').replace(/\s+/g, " ").trim(),
        ),
    );
    return { passed: missing.length === 0, missing };
  }

  if (challenge.expectedOutput) {
    const expected = challenge.expectedOutput
      .toLowerCase()
      .replace(/['"]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    const passed =
      norm.includes(expected) || expected.includes(norm.slice(0, 40));
    return { passed, missing: [] };
  }

  return { passed: true, missing: [] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null); // { type, message, missing }
  const [hintsOpen, setHintsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [courseCompleted, setCourseCompleted] = useState(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [runKey, setRunKey] = useState(0); // incremented to re-run JS
  const [activeTab, setActiveTab] = useState("editor"); // mobile tabs

  // ── Load lesson ──
  useEffect(() => {
    api.lessons
      .get(id)
      .then((data) => {
        setLesson(data);
        setCode(data.challenges?.[0]?.starterCode ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const challenge = lesson?.challenges?.[currentIdx];
  const lang = lesson?.language ?? "html";
  const isJs = lang === "javascript";

  // ── Handlers ──

  const handleCheck = useCallback(() => {
    if (!challenge) return;
    const result = validate(code, challenge);
    if (result.passed) {
      setFeedback({
        type: "success",
        message: "Great work! That's correct. 🎉",
      });
    } else {
      const missing = result.missing.length
        ? `Missing: ${result.missing.map((m) => `\`${m}\``).join(", ")}`
        : "Not quite — review the instructions and try again.";
      setFeedback({ type: "error", message: missing });
    }
  }, [code, challenge]);

  const handleNext = useCallback(() => {
    const challenges = lesson?.challenges ?? [];
    if (currentIdx + 1 < challenges.length) {
      const next = challenges[currentIdx + 1];
      setCurrentIdx((i) => i + 1);
      setCode(next.starterCode ?? "");
      setFeedback(null);
      setHintsOpen(false);
      setRunKey(0);
    } else {
      finishLesson();
    }
  }, [currentIdx, lesson]);

  const handleReset = useCallback(() => {
    setCode(challenge?.starterCode ?? "");
    setFeedback(null);
  }, [challenge]);

  async function finishLesson() {
    try {
      const data = await api.lessons.complete(lesson.id);
      updateUser({
        xp: data.xp,
        coins: data.coins,
        streak: data.streak,
        completedLessons: data.completedLessons,
        completedCourses: data.completedCourses,
        achievements: data.achievements,
      });
      setEarnedXp(lesson.xpReward ?? 0);
      setEarnedCoins(data.coins - (user?.coins ?? 0));
      setNewAchievements(data.newAchievements ?? []);
      setCourseCompleted(data.courseJustCompleted ?? null);
    } catch {
      // still show completion screen
    }
    setCompleted(true);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-muted">
        Loading lesson…
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

  // ── Completion screen ──
  if (completed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Lesson Complete! 🎉</h2>

          {courseCompleted && (
            <div className="mt-2 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm font-semibold text-yellow-800">
              🏆 You completed the entire{" "}
              <span className="uppercase">{courseCompleted}</span> course!
            </div>
          )}

          <div className="flex justify-center gap-6 my-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-extrabold text-yellow-500">
                +{earnedXp}
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Zap size={12} /> XP
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-extrabold text-yellow-600">
                +{earnedCoins}
              </span>
              <span className="text-xs text-muted">🪙 coins</span>
            </div>
          </div>

          {newAchievements.length > 0 && (
            <div className="mb-5">
              <p className="font-bold text-sm mb-2">New Achievements</p>
              <div className="flex flex-wrap justify-center gap-2">
                {newAchievements.map((a) => (
                  <div
                    key={a.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5 text-sm"
                  >
                    {a.icon} <span className="font-semibold">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link
              to={`/learn/${lesson.language}`}
              className="bg-background hover:bg-border text-foreground font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Back to Lessons
            </Link>
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

  // ── IDE layout ──
  const challenges = lesson.challenges ?? [];

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* ── Top bar ── */}
      <header className="shrink-0 bg-[#1e1e1e] border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm">
        <Link
          to={`/learn/${lesson.language}`}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-gray-400">
          <BookOpen size={14} />
          <span className="font-semibold text-white">{lesson.title}</span>
          <span className="text-gray-600">·</span>
          <span>
            Step {currentIdx + 1} of {challenges.length}
          </span>
        </div>

        <div className="hidden sm:block">
          <ProgressDots
            total={challenges.length}
            current={currentIdx}
            completed={currentIdx}
          />
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
          <span className="text-yellow-400 font-semibold">
            ⚡ {lesson.xpReward} XP
          </span>
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

      {/* ── Mobile tabs ── */}
      <div className="shrink-0 flex sm:hidden border-b border-gray-700 bg-[#1e1e1e]">
        {[
          { key: "instructions", icon: <BookOpen size={14} />, label: "Task" },
          { key: "editor", icon: <Code2 size={14} />, label: "Code" },
          { key: "preview", icon: <Monitor size={14} />, label: "Preview" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === t.key
                ? "text-white border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Instructions panel */}
        <aside
          className={`
          sm:flex flex-col w-full sm:w-72 xl:w-80 shrink-0
          overflow-y-auto border-r border-gray-700 bg-[#252526] p-5
          ${activeTab === "instructions" ? "flex" : "hidden"}
        `}
        >
          <div className="mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Challenge {currentIdx + 1} / {challenges.length}
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-white mb-2">
            {challenge?.title}
          </h2>

          <p className="text-sm text-gray-400 mb-4">{challenge?.description}</p>

          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-4 text-sm text-gray-300 mb-4 leading-relaxed">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              📋 Instructions
            </p>
            {challenge?.instructions}
          </div>

          {/* Hints */}
          {challenge?.hints?.length > 0 && (
            <div>
              <button
                onClick={() => setHintsOpen((o) => !o)}
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium mb-2 transition-colors"
              >
                <Lightbulb size={15} />
                {hintsOpen ? "Hide hints" : "Show hints"}
              </button>
              {hintsOpen && (
                <ul className="space-y-1.5 text-sm text-gray-400">
                  {challenge.hints.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400 shrink-0">💡</span>
                      <code className="font-mono text-xs bg-[#1e1e1e] px-2 py-1 rounded">
                        {h}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* Right: Editor + Preview */}
        <div
          className={`
          sm:flex flex-1 flex-col overflow-hidden min-w-0
          ${activeTab !== "instructions" ? "flex" : "hidden"}
        `}
        >
          {/* Monaco editor */}
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
                onChange={(v) => {
                  setCode(v ?? "");
                  setFeedback(null);
                }}
                theme="vs-dark"
                options={EDITOR_OPTIONS}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500 text-sm">
                    Loading editor…
                  </div>
                }
              />
            </div>
          </div>

          {/* Preview / Console panel */}
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
                  onClick={() => setRunKey((k) => k + 1)}
                  className="ml-auto flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                >
                  <Play size={10} /> Run
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <LivePreview
                code={code}
                language={lang}
                baseHtml={challenge?.baseHtml}
                runKey={runKey}
              />
            </div>
          </div>

          {/* ── Footer toolbar ── */}
          <div className="shrink-0 bg-[#2d2d2d] border-t border-gray-700 px-4 py-2 flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-gray-700"
            >
              <RotateCcw size={13} /> Reset
            </button>

            {/* Feedback inline */}
            {feedback && (
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                  feedback.type === "success"
                    ? "bg-green-900/50 text-green-400 border border-green-700"
                    : "bg-red-900/50 text-red-400 border border-red-800"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <XCircle size={13} />
                )}
                <span className="max-w-xs truncate">{feedback.message}</span>
              </div>
            )}

            <div className="flex-1" />

            {!feedback || feedback.type === "error" ? (
              <button
                onClick={handleCheck}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors"
              >
                {currentIdx + 1 < challenges.length
                  ? "Next Step"
                  : "Finish Lesson"}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
