import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Moon, Sun, Menu, X, User, LogOut, Code2 } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Theme toggle state
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply theme on mount and when dark changes
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // Toggle theme
  const toggleTheme = () => setDark((prev) => !prev);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Code2 className="h-7 w-7 text-primary" />
            <span>Coddy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/learn/all" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                  My Courses
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Desktop theme toggle – always visible */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 rounded-lg border border-border bg-surface text-muted hover:bg-surface-hover"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User menu (if logged in) */}
            {user && (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-hover transition-colors"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <User size={18} className="text-muted" />
                  )}
                  <span className="hidden sm:inline text-foreground">{user.name}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg border border-border bg-surface text-muted hover:bg-surface-hover"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-surface p-4 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm font-medium text-foreground border-b border-border mb-2">
                  {user.name}
                </div>
                <Link
                  to="/"
                  className="block px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/learn/all"
                  className="block px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  My Courses
                </Link>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full px-3 py-2 text-sm text-white bg-primary rounded-lg text-center hover:bg-primary-dark"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-border">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-surface-hover rounded-lg"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                <span>{dark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}