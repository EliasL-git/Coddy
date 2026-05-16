import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  BookOpen,
  Coins,
  Flame,
  Zap,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, tone = "text-foreground" }) {
  return (
    <div className="rounded-3xl border border-border bg-surface/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className={`mb-2 inline-flex rounded-2xl p-2 ${tone}/10`}>
        <Icon size={18} className={tone} />
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [courseData, lessonData, board] = await Promise.all([
          api.lessons.getCourses(),
          api.lessons.list(),
          api.user.leaderboard(),
        ]);
        setCourses(courseData);
        setLessons(lessonData);
        setLeaderboard(board);
      } catch {
        // keep the dashboard usable even if ancillary data fails
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedSet = new Set(user?.completedLessons || []);
  const completedCourses = new Set(user?.completedCourses || []);

  const courseCards = useMemo(() => {
    return courses.map((course) => {
      const chapterIds = new Set((course.lessons || []).map((lesson) => lesson.id));
      const completed = lessons.filter(
        (lesson) => lesson.courseId === course.id && completedSet.has(lesson.id),
      ).length;
      const total = chapterIds.size || course.lessons?.length || 0;
      const progress = total ? Math.round((completed / total) * 100) : 0;

      return { ...course, completed, total, progress };
    });
  }, [courses, lessons, completedSet]);

  const totalLessons = lessons.length;
  const completedLessons = completedSet.size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted">Just continue learning</p>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 w-full lg:w-auto">
            <div className="rounded-2xl border border-border bg-background p-3 text-center">
              <div className="text-lg font-black text-orange-300">{user?.streak || 0}</div>
              <div className="text-xs text-muted">Streak</div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3 text-center">
              <div className="text-lg font-black text-yellow-300">{user?.xp || 0}</div>
              <div className="text-xs text-muted">XP</div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3 text-center">
              <div className="text-lg font-black text-amber-300">{user?.coins ?? 0}</div>
              <div className="text-xs text-muted">Coins</div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3 text-center">
              <div className="text-lg font-black text-cyan-300">{completedLessons}/{totalLessons}</div>
              <div className="text-xs text-muted">Done</div>
            </div>
          </div>
        </div>
      </section>

      {courseCards.length > 0 && (
        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-xl font-black tracking-tight mb-4">Courses</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courseCards.map((course) => (
              <Link
                key={course.id}
                to={`/learn/${course.id}`}
                className="flex flex-col justify-between rounded-2xl border border-border bg-background p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{course.icon || "📚"}</div>
                    <div>
                      <div className="font-black">{course.title || course.name}</div>
                      {course.description && (
                        <div className="text-sm text-muted mt-1 line-clamp-2">{course.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs text-muted mb-1">Progress</div>
                    <div className="w-full rounded-xl bg-border h-3 overflow-hidden">
                      <div
                        className="h-3 bg-primary"
                        style={{ width: `${course.progress || 0}%` }}
                        aria-valuenow={course.progress || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted mt-2">
                      <div>{course.completed}/{course.total} chapters</div>
                      <div>{course.progress}%</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-right text-xs text-muted">Start</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-border bg-surface p-6">
          <h3 className="font-black text-lg mb-4">Achievements</h3>
          {user?.achievements?.length ? (
            <div className="flex flex-wrap gap-2">
              {user.achievements.slice(-8).map((achievement) => (
                <div key={achievement.id} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs">
                  <span>{achievement.icon}</span>
                  <span>{achievement.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Complete chapters to earn achievements.</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-border bg-surface p-6">
          <h3 className="font-black text-lg mb-4">Leaderboard</h3>
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : leaderboard.length ? (
            <ul className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <li key={entry._id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">#{index + 1} {entry.username}</span>
                  <span className="text-muted">{entry.xp} XP</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No users yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
