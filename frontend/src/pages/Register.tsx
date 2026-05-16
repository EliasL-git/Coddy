import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Code2, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.register({ username, email, password });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-primary">
            <Code2 size={40} />
            <span className="text-3xl font-extrabold">Coddy</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="text-xl font-bold mb-1">Create account</h1>
          <p className="text-muted text-sm mb-5">Start learning to code today</p>

          {error && (
            <div className="bg-wrong-light text-wrong text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
          )}

          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="coddy_dev"
          />

          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="you@example.com"
          />

          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative mb-5">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
