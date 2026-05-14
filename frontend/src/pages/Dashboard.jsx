import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  Code2,
  FileCode2,
  Braces,
  Flame,
  Star,
  Zap,
  Trophy,
} from "lucide-react";

const languages = [
  {
    key: "html",
    name: "HTML",
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: FileCode2,
  },
  {
    key: "css",
    name: "CSS",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Code2,
  },
  {
    key: "javascript",
    name: "JavaScript",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: Braces,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [l, board] = await Promise.all([
          api.lessons.list(),
          api.user.leaderboard(),
        ]);
        setLessons(l);
        setLeaderboard(board);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedSet = new Set(user?.completedLessons || []);

  function progressFor(lang) {
    const all = lessons.filter((x) => x.language === lang);
    const done = all.filter((x) => completedSet.has(x.id));
    return { total: all.length, done: done.length };
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-muted">Ready to keep learning?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-orange-500 font-bold">
              <Flame size={20} />
              {user?.streak || 0} day streak
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
              <Zap size={20} />
              {user?.xp || 0} XP
            </div>
            <div className="flex items-center gap-1.5 text-yellow-600 font-bold">
              🪙 {user?.coins ?? 0} coins
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">Choose a language</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {languages.map((lang) => {
          const { total, done } = progressFor(lang.key);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const Icon = lang.icon;
          const isCourseComplete = user?.completedCourses?.includes(lang.key);
          return (
            <Link
              key={lang.key}
              to={`/learn/${lang.key}`}
              className={`${lang.bg} ${lang.border} border rounded-2xl p-5 hover:shadow-md transition-shadow relative`}
            >
              {isCourseComplete && (
                <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  ✅ Complete
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`${lang.color}`}>
                  <Icon size={28} />
                </div>
                <span className="text-lg font-bold">{lang.name}</span>
              </div>
              <p className="text-sm text-muted mb-3">
                {done}/{total} lessons completed
              </p>
              <div className="w-full bg-white rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${lang.color.replace("text-", "bg-")}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-yellow-500" size={20} />
            <h3 className="font-bold">Recent Achievements</h3>
          </div>
          {user?.achievements?.length ? (
            <div className="flex flex-wrap gap-2">
              {user.achievements.slice(-6).map((a) => (
                <div
                  key={a.id}
                  className="bg-background rounded-xl px-3 py-2 text-sm border border-border"
                >
                  <span className="mr-1">{a.icon}</span>
                  <span className="font-semibold">{a.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">
              Complete lessons to earn achievements!
            </p>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-secondary" size={20} />
            <h3 className="font-bold">Leaderboard</h3>
          </div>
          {loading ? (
            <p className="text-muted text-sm">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.slice(0, 5).map((u, i) => (
                <li
                  key={u._id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">
                    #{i + 1} {u.username}
                  </span>
                  <span className="text-muted">{u.xp} XP</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
