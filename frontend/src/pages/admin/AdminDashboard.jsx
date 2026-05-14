import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Users, BookOpen, Zap, ShieldCheck } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-extrabold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading stats…</p>;
  if (error) return <p className="text-wrong">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-secondary" />
        <StatCard icon={BookOpen} label="Total Lessons" value={stats.totalLessons} color="bg-primary" />
        <StatCard icon={Zap} label="Total XP Awarded" value={stats.totalXP?.toLocaleString()} color="bg-yellow-400" />
        <StatCard icon={ShieldCheck} label="Admins" value={stats.usersByRole?.admin ?? 0} color="bg-purple-500" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 max-w-xs">
        <h2 className="font-bold mb-3">Users by Role</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Regular users</span>
            <span className="font-semibold">{stats.usersByRole?.user ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Admins</span>
            <span className="font-semibold">{stats.usersByRole?.admin ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
