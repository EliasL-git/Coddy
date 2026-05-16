import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShieldCheck,
  Gift,
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/lessons", label: "Lessons", icon: BookOpen },
  { to: "/admin/prizes", label: "Prizes", icon: Gift },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col pt-6 px-3">
        <div className="flex items-center gap-2 px-3 mb-6">
          <ShieldCheck size={20} className="text-primary" />
          <span className="font-bold text-sm text-primary uppercase tracking-wide">
            Admin Panel
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
