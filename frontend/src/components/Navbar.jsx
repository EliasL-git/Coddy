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
  Moon,
  Sun,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  if (isAdmin) {
    navItems.push({ to: "/admin", icon: ShieldCheck, label: "Admin" });
    navItems.push({ to: "/shop", icon: ShoppingBag, label: "Shop" });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur supports-backdrop-blur:bg-surface/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3 transition-transform hover:scale-[1.02]"
          aria-label="Coddy - Return to dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/20 ring-1 ring-black/5 transition-all group-hover:shadow-primary/40">
            <Code2 size={22} strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Coddy
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
                <Sparkles size={10} />
                v0.2
              </span>
            </div>
            <p className="hidden text-xs text-muted sm:block">
              Build. Learn. Earn.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground-light transition-all hover:bg-surface-hover hover:text-primary"
              aria-label={label}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const html = document.documentElement;
              if (html.classList.contains("dark")) {
                html.classList.remove("dark");
              } else {
                html.classList.add("dark");
              }
            }}
            className="ml-2 rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun size={18} className="hidden dark:block" />
            <Moon size={18} className="block dark:hidden" />
          </button>

          {/* User Menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-surface-hover"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User size={18} />
                </div>
              )}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                <div className="border-b border-border px-4 py-2">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground-light hover:bg-surface-hover hover:text-error"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-light transition-colors hover:bg-surface-hover hover:text-primary"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <button
              onClick={() => {
                document.documentElement.classList.toggle("dark");
                document.documentElement.classList.toggle("light");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-light transition-colors hover:bg-surface-hover hover:text-primary"
            >
              <Sun size={18} className="hidden dark:block" />
              <Moon size={18} className="block dark:hidden" />
              <span>Toggle theme</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-light transition-colors hover:bg-surface-hover hover:text-error"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
