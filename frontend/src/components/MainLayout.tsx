import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-border bg-surface py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Coddy</span>
              <span className="text-muted">·</span>
              <span className="text-sm text-muted">Learn to code, earn rewards</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} Coddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
