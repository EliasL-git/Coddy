import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { Search, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Badge({ role }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
      <ShieldCheck size={11} /> admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      user
    </span>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null); // userId being acted on

  const load = useCallback((q = '') => {
    setLoading(true);
    api.admin.users(q)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setBusy(u._id);
    try {
      const updated = await api.admin.updateUser(u._id, { role: newRole });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: updated.role } : x)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setBusy(u._id);
    try {
      await api.admin.deleteUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Users</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); load(''); }}
            className="px-3 py-2 rounded-xl border border-border text-sm text-muted hover:bg-background transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {error && <p className="text-wrong text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted">
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">XP</th>
                <th className="px-4 py-3 font-semibold">Streak</th>
                <th className="px-4 py-3 font-semibold">Lessons</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-8">No users found.</td>
                </tr>
              )}
              {users.map((u) => {
                const isMe = u._id === me?.id;
                const isBusy = busy === u._id;
                return (
                  <tr key={u._id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {u.username}
                      {isMe && <span className="ml-1 text-xs text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3"><Badge role={u.role} /></td>
                    <td className="px-4 py-3">{u.xp}</td>
                    <td className="px-4 py-3">{u.streak}</td>
                    <td className="px-4 py-3">{u.completedLessons?.length ?? 0}</td>
                    <td className="px-4 py-3 text-muted">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Toggle role — don't let admin demote themselves */}
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={isBusy || isMe}
                          title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                          className="p-1.5 rounded-lg hover:bg-background disabled:opacity-40 transition-colors text-muted hover:text-foreground"
                        >
                          {u.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        </button>
                        {/* Delete — can't delete yourself */}
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={isBusy || isMe}
                          title="Delete user"
                          className="p-1.5 rounded-lg hover:bg-background disabled:opacity-40 transition-colors text-muted hover:text-wrong"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
