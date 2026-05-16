import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import type { Course } from "../types";
import {
  BookOpen,
  Flame,
  Trophy,
  Target,
  ChevronRight,
  Award,
  Star,
  Zap,
  Medal,
  Crown,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color = "primary", trend }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="group rounded-xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-all">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colorClasses[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? "text-secondary" : "text-error"
            }`}
          >
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-sm text-muted mt-1">{label}</div>
    </div>
  );
}

function CourseCard({
  course,
  progress,
  completed,
  total,
}: {
  course: Course;
  progress: number;
  completed: number;
  total: number;
}) {
  const progressPercent = total ? Math.round((completed / total) * 100) : 0;

  // Determine status badge
  const isCompleted = progressPercent === 100;
  const isInProgress = progressPercent > 0 && progressPercent < 100;

  return (
    <Link
      to={`/learn/${course.id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all"
    >
      {/* Card header with icon and status */}
      <div className="relative bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <BookOpen size={24} />
          </div>
          {isCompleted && (
            <div className="rounded-full bg-secondary p-1">
              <Star size={16} className="text-white" />
            </div>
          )}
        </div>
        <h3 className="mt-3 font-bold text-lg text-foreground line-clamp-2">
          {course.title || course.name}
        </h3>
        {course.description && (
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      {/* Card body with progress */}
      <div className="flex-1 p-4 pt-0">
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Progress</span>
            <span className="font-semibold text-foreground">
              {completed}/{total} lessons
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {isCompleted
                ? "Completed"
                : isInProgress
                ? "In progress"
                : "Not started"}
            </span>
            <span className="text-xs font-medium text-primary">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Lesson count */}
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <BookOpen size={16} />
          <span>{total} lessons</span>
          {course.difficulty && (
            <>
              <span className="text-border">•</span>
              <span className="capitalize">{course.difficulty}</span>
            </>
          )}
        </div>
      </div>

      {/* Card footer with CTA */}
      <div className="border-t border-border p-3 bg-surface-hover">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary group-hover:underline">
            {isCompleted ? "Review" : "Continue"}
          </span>
          <ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function AchievementBadge({ achievement }) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 hover:bg-primary/5 hover:border-primary/30 transition-all">
      <div className="text-lg">{achievement.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{achievement.name}</p>
        <p className="text-xs text-muted">{achievement.description}</p>
      </div>
    </div>
  );
}

function LeaderboardEntry({ entry, index }) {
  const getMedalColor = (idx) => {
    if (idx === 0) return "text-yellow-500";
    if (idx === 1) return "text-gray-400";
    if (idx === 2) return "text-amber-600";
    return "text-muted";
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Crown size={16} className="text-yellow-500" />;
    if (idx === 1) return <Medal size={16} className="text-gray-400" />;
    if (idx === 2) return <Medal size={16} className="text-amber-600" />;
    return <span className="text-sm font-bold text-muted">#{idx + 1}</span>;
  };

  const isCurrentUser = entry._id === entry.userId;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
        isCurrentUser ? "bg-primary/5 border border-primary/20" : "hover:bg-surface-hover"
      } transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 text-center">{getRankIcon(index)}</div>
        <div>
          <p
            className={`text-sm font-medium ${
              isCurrentUser ? "text-primary" : "text-foreground"
            }`}
          >
            {entry.username}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-primary">(you)</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-warning" />
        <span className="text-sm font-bold text-foreground">{entry.xp} XP</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedSet = useMemo(
    () => new Set(user?.completedLessons || []),
    [user?.completedLessons]
  );
  const completedCourses = useMemo(
    () => new Set(user?.completedCourses || []),
    [user?.completedCourses]
  );

  const courseCards = useMemo(() => {
    return courses
      .map((course) => {
        const chapterIds = new Set((course.lessons || []).map((lesson) => lesson.id));
        const completed = lessons.filter(
          (lesson) => lesson.courseId === course.id && completedSet.has(lesson.id),
        ).length;
        const total = chapterIds.size || course.lessons?.length || 0;
        const progress = total ? Math.round((completed / total) * 100) : 0;
        const isCompleted = completedCourses.has(course.id);

        return {
          ...course,
          completed,
          total,
          progress,
          isCompleted,
        };
      })
      // Sort: in-progress first, then not started, then completed
      .sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return b.progress - a.progress;
      });
  }, [courses, lessons, completedSet, completedCourses]);

  const totalLessons = lessons.length;
  const completedLessons = completedSet.size;
  const totalXP = user?.xp || 0;
  const streak = user?.streak || 0;
  const coins = user?.coins ?? 0;

  // Get next lesson recommendation (first incomplete lesson from any course)
  const nextLesson = useMemo(() => {
    for (const course of courseCards) {
      if (!course.isCompleted && course.total > 0) {
        return {
          course: course.title || course.name,
          courseId: course.id,
          message: `Continue ${course.title || course.name}`,
        };
      }
    }
    return null;
  }, [courseCards]);

  // Recent achievements (last 4)
  const recentAchievements = useMemo(() => {
    return (user?.achievements || []).slice(-4).reverse();
  }, [user?.achievements]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-border" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-border" />
          <div className="h-64 animate-pulse rounded-xl bg-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-8">
      {/* Welcome section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Learner"}!
          </h1>
          <p className="mt-1 text-muted">
            {nextLesson
              ? `Continue your journey: ${nextLesson.message}`
              : "Explore new courses and keep learning!"}
          </p>
        </div>
        {nextLesson && (
          <Link
            to={`/lesson/${nextLesson.courseId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-dark hover:shadow-md transition-all"
          >
            <Zap size={18} />
            Continue Learning
          </Link>
        )}
      </section>

      {/* Key metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={streak}
          color="warning"
          trend={streak > 0 ? 12 : 0}
        />
        <StatCard
          icon={Trophy}
          label="Total XP"
          value={totalXP.toLocaleString()}
          color="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Completed Lessons"
          value={`${completedLessons}/${totalLessons}`}
          color="secondary"
        />
        <StatCard
          icon={Star}
          label="Coins"
          value={coins.toLocaleString()}
          color="accent"
        />
      </section>

      {/* Courses grid */}
      {courseCards.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Your Courses</h2>
            <Link
              to="/learn/all"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courseCards.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                completed={course.completed}
                total={course.total}
              />
            ))}
          </div>
        </section>
      )}

      {/* Secondary content: Achievements & Leaderboard */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Achievements */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Award size={20} className="text-accent" />
            <h3 className="font-bold text-lg text-foreground">Recent Achievements</h3>
          </div>
          {recentAchievements.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {recentAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-surface-hover p-4 text-center">
              <p className="text-sm text-muted">
                Complete lessons to unlock achievements and badges.
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-warning" />
              <h3 className="font-bold text-lg text-foreground">Leaderboard</h3>
            </div>
            <Link
              to="/leaderboard"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-border" />
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <ul className="space-y-1">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <LeaderboardEntry key={entry._id} entry={entry} index={index} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-surface-hover p-4 text-center">
              <p className="text-sm text-muted">No rankings yet. Be the first!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}