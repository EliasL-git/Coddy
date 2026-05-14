import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Zap, Flame, Award, ArrowLeft, Code2, FileCode2, Braces } from 'lucide-react';

const langMeta = {
  html: { label: 'HTML', icon: FileCode2, color: 'text-orange-500' },
  css: { label: 'CSS', icon: Code2, color: 'text-blue-500' },
  javascript: { label: 'JavaScript', icon: Braces, color: 'text-yellow-500' },
};

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm text-muted hover:text-foreground">← Back to Dashboard</Link>

      <div className="bg-surface rounded-2xl border border-border p-6 mt-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-extrabold">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{user?.username}</h1>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-background rounded-xl p-3 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold text-lg">
              <Zap size={18} /> {user?.xp || 0}
            </div>
            <p className="text-xs text-muted">Total XP</p>
          </div>
          <div className="bg-background rounded-xl p-3 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-lg">
              <Flame size={18} /> {user?.streak || 0}
            </div>
            <p className="text-xs text-muted">Day Streak</p>
          </div>
          <div className="bg-background rounded-xl p-3 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-secondary font-bold text-lg">
              <Award size={18} /> {user?.achievements?.length || 0}
            </div>
            <p className="text-xs text-muted">Achievements</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">Achievements</h2>
      {user?.achievements?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {user.achievements.map((a) => (
            <div key={a.id} className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="text-2xl">{a.icon}</div>
              <div>
                <p className="font-bold text-sm">{a.name}</p>
                <p className="text-muted text-xs">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm mb-6">No achievements yet. Complete lessons to earn them!</p>
      )}

      <h2 className="text-lg font-bold mb-3">Completed Lessons</h2>
      {user?.completedLessons?.length ? (
        <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
          {user.completedLessons.map((id) => {
            const lang = id.split('-')[0];
            const meta = langMeta[lang] || langMeta.html;
            const Icon = meta.icon;
            return (
              <div key={id} className="px-4 py-3 flex items-center gap-3">
                <Icon size={18} className={meta.color} />
                <span className="text-sm font-medium">{id}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted text-sm">No lessons completed yet.</p>
      )}
    </div>
  );
}
