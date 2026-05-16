import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Code2,
  Trophy,
  User,
  LogOut,
  Home,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#58cc02_0%,#1cb0f6_100%)] text-white shadow-lg shadow-primary/20 transition-transform group-hover:-rotate-6">
            <Code2 size={22} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2 font-black text-lg tracking-tight text-foreground">
              Coddy
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Sparkles size={10} />
                v0.2
              </span>
            </div>
            <p className="text-xs text-muted">Build the same project chapter by chapter</p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
          >
            <Home size={20} />
          </Link>
          <Link
            to="/leaderboard"
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
          >
            <Trophy size={20} />
          </Link>
          <Link
            to="/profile"
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
          >
            <User size={20} />
          </Link>
          <Link
            to="/shop"
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
            title="Shop"
          >
            <ShoppingBag size={20} />
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-yellow-50 text-yellow-600 font-bold text-sm hover:bg-yellow-100 transition-colors"
          >
            🪙 {user?.coins ?? 0}
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              title="Admin Panel"
              className="p-2 rounded-xl hover:bg-background text-muted hover:text-primary transition-colors"
            >
              <ShieldCheck size={20} />
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-2 rounded-xl hover:bg-background text-muted hover:text-wrong transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
