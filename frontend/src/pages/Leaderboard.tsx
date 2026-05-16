import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Trophy, Medal, Zap } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.user.leaderboard();
        setUsers(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm text-muted hover:text-foreground">← Back to Dashboard</Link>
      <h1 className="text-2xl font-extrabold mt-2 mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={28} /> Leaderboard
      </h1>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
          {users.map((u, i) => (
            <div key={u._id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted">
                  {i === 0 ? <Medal className="text-yellow-500" size={18} /> : i === 1 ? <Medal className="text-gray-400" size={18} /> : i === 2 ? <Medal className="text-amber-600" size={18} /> : `#${i + 1}`}
                </span>
                <span className="font-medium">{u.username}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                <Zap size={16} /> {u.xp} XP
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="px-4 py-6 text-muted text-sm text-center">No users yet. Be the first! 🚀</p>
          )}
        </div>
      )}
    </div>
  );
}
