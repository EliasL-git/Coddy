import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { ChevronRight, Lock, CheckCircle2, Circle } from "lucide-react";

export default function Language() {
  const { lang } = useParams();
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [lessonsData, coursesData] = await Promise.all([
          api.lessons.list(lang),
          api.lessons.getCourses(lang),
        ]);
        setLessons(lessonsData.sort((a, b) => a.order - b.order));
        setCourses(coursesData);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lang]);

  const completedSet = new Set(user?.completedLessons || []);

  function isUnlocked(lesson, idx) {
    if (idx === 0) return true;
    const prereqs = lesson.prerequisites || [];
    if (!prereqs.length) return true;
    return prereqs.every((p) => completedSet.has(p));
  }

  const langLabel =
    lang === "html" ? "HTML" : lang === "css" ? "CSS" : "JavaScript";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted hover:text-foreground">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold mt-2">{langLabel} Lessons</h1>
      </div>

      {loading ? (
        <p className="text-muted">Loading lessons...</p>
      ) : (
        <>
          {courses.map(
            (course) =>
              course.introduction && (
                <div
                  key={course.id}
                  className="mb-8 bg-surface rounded-3xl border border-border p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span className="text-2xl">{course.icon}</span>
                    {course.introduction.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    {course.introduction.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                        What you'll learn
                      </h3>
                      <ul className="space-y-2">
                        {course.introduction.whatYouWillLearn?.map(
                          (item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <CheckCircle2
                                size={16}
                                className="text-primary mt-0.5 shrink-0"
                              />
                              {item}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                        Examples
                      </h3>
                      <div className="space-y-3">
                        {course.introduction.examples?.map((ex, i) => (
                          <div
                            key={i}
                            className="bg-background rounded-xl p-3 border border-border"
                          >
                            <p className="text-xs font-bold text-primary mb-1">
                              {ex.title}
                            </p>
                            <code className="block bg-black/30 p-2 rounded text-[11px] font-mono text-gray-300 mb-1 overflow-x-auto">
                              {ex.code}
                            </code>
                            <p className="text-[10px] text-muted">
                              {ex.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ),
          )}

          <div className="space-y-3">
            {lessons.map((lesson, idx) => {
              const done = completedSet.has(lesson.id);
              const unlocked = isUnlocked(lesson, idx);
              return (
                <div
                  key={lesson.id}
                  className={`bg-surface rounded-2xl border p-4 flex items-center justify-between ${
                    unlocked ? "border-border" : "border-border opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-border">
                      {done ? (
                        <CheckCircle2 className="text-primary" size={20} />
                      ) : unlocked ? (
                        <Circle className="text-muted" size={20} />
                      ) : (
                        <Lock className="text-muted" size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{lesson.title}</p>
                      <p className="text-muted text-xs">{lesson.description}</p>
                    </div>
                  </div>
                  {unlocked ? (
                    <Link
                      to={`/lesson/${lesson.id}`}
                      className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      {done ? "Review" : "Start"}
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted font-medium px-3 py-2">
                      Locked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
