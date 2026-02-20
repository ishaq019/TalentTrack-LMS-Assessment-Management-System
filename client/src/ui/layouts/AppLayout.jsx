// client/src/ui/layouts/AppLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";
import clsx from "clsx";

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-purple-600/20 text-purple-200 ring-1 ring-purple-500/30"
            : "text-slate-200/80 hover:bg-slate-800/50 hover:text-slate-100"
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-purple-500/30">
              <span className="text-lg font-black text-purple-200">T</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">
                Talent<span className="text-purple-300">Track</span>
              </div>
              <div className="text-xs text-slate-400">Student Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user?.name || "User"}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <nav className="flex flex-wrap gap-2">
            <Tab to="/dashboard" label="Dashboard" />
            <Tab to="/assignments" label="Assignments" />
            <Tab to="/practice" label="Practice" />
            <Tab to="/results" label="Results" />
            <Tab to="/reports" label="Monthly Report" />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Quick breadcrumb-ish hint */}
        <div className="mb-5 text-xs text-slate-400">
          <span className="opacity-70">You are here:</span>{" "}
          <span className="text-slate-200">{pathname}</span>
        </div>

        <Outlet />
      </main>

      <footer className="border-t border-slate-800/70 py-6">
        <div className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          © {new Date().getFullYear()} TalentTrack — Student Portal
        </div>
      </footer>
    </div>
  );
}
