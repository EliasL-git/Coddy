import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Trophy, User, LogOut, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Code2 size={28} />
          Coddy
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors">
            <Home size={20} />
          </Link>
          <Link to="/leaderboard" className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors">
            <Trophy size={20} />
          </Link>
          <Link to="/profile" className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors">
            <User size={20} />
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-wrong transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
