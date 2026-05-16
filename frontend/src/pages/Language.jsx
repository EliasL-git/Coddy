import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Language() {
  const { lang: courseId } = useParams();
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [lessonsData, coursesData] = await Promise.all([
          api.lessons.list(),
          api.lessons.getCourses(),
        ]);
        setLessons(lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0)));
        setCourses(coursesData);
      } catch {
        // keep the page usable even if the API call fails
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  const completedSet = new Set(user?.completedLessons || []);

  const selectedCourse = useMemo(() => {
    return (
      courses.find((course) => course.id === courseId) ||
      courses.find((course) => course.lessons?.some((lesson) => lesson.language === courseId)) ||
      null
    );
  }, [courses, courseId]);

  const courseLessons = useMemo(() => {
    if (!selectedCourse) {
      return lessons.filter((lesson) => lesson.language === courseId || lesson.courseId === courseId);
    }
    return lessons
      .filter((lesson) => lesson.courseId === selectedCourse.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [lessons, selectedCourse, courseId]);

  const isLegacyLanguageMode = !selectedCourse;

  function isUnlocked(lesson, idx) {
    if (idx === 0) return true;
    const prereqs = lesson.prerequisites || [];
    if (!prereqs.length) return true;
    return prereqs.every((prerequisite) => completedSet.has(prerequisite));
  }

  const chapterDone = courseLessons.filter((lesson) => completedSet.has(lesson.id)).length;
  const chapterTotal = courseLessons.length;
  const chapterProgress = chapterTotal ? Math.round((chapterDone / chapterTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link to="/" className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
          ← Back
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">Loading project…</p>
      ) : (
        <>
          <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight text-black">
                {selectedCourse?.title || `${courseId} track`}
              </h1>
              <p className="mt-2 text-sm text-black">
                {selectedCourse?.description || "Keep the same project open and improve it chapter by chapter."}
              </p>
            </div>

            <div className="grid gap-3 grid-cols-3 mb-6">
              <div className="rounded-2xl border border-border bg-background p-3 text-center">
                <div className="font-black text-lg">{chapterTotal}</div>
                <div className="text-xs text-muted">Chapters</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-center">
                <div className="font-black text-lg">{chapterProgress}%</div>
                <div className="text-xs text-muted">Done</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-center">
                <div className="font-black text-lg">{chapterDone}/{chapterTotal}</div>
                <div className="text-xs text-muted">Chapters</div>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#58cc02_0%,#1cb0f6_100%)] transition-all"
                style={{ width: `${chapterProgress}%` }}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <h2 className="font-black text-lg mb-4">Chapters</h2>

            <div className="space-y-2">
              {courseLessons.map((lesson, idx) => {
                const done = completedSet.has(lesson.id);
                const unlocked = isUnlocked(lesson, idx);

                return (
                  <Link
                    key={lesson.id}
                    to={`/lesson/${lesson.id}`}
                    className={`rounded-2xl border p-3 flex items-center justify-between transition-colors ${unlocked ? "border-border bg-background hover:border-primary/30" : "border-border bg-background/70 opacity-70 cursor-not-allowed"}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-sm font-bold ${done ? "text-green-600" : "text-black"}`}>
                      {done ? "✓" : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-black">{lesson.title}</h3>
                      <p className="text-xs text-black truncate">{lesson.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black ml-2 shrink-0">
                      {lesson.language}
                    </span>
                  </Link>
                );
              })}

              {!courseLessons.length && !isLegacyLanguageMode && (
                <p className="text-sm text-muted">No chapters found for this project.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
