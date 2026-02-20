// client/src/ui/layouts/AdminLayout.jsx
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
            ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25"
            : "text-slate-200/80 hover:bg-slate-800/50 hover:text-slate-100"
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
              <span className="text-lg font-black text-emerald-200">A</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">
                Talent<span className="text-purple-300">Track</span>
              </div>
              <div className="text-xs text-slate-400">Admin Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user?.name || "Admin"}</div>
              <div className="text-xs text-slate-400">
                {user?.email} • <span className="text-emerald-200">admin</span>
              </div>
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
            <Tab to="/admin" label="Overview" />
            <Tab to="/admin/tests" label="Tests" />
            <Tab to="/admin/assignments" label="Assign Tests" />
            <Tab to="/admin/submissions" label="Submissions" />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 text-xs text-slate-400">
          <span className="opacity-70">Admin path:</span>{" "}
          <span className="text-slate-200">{pathname}</span>
        </div>

        <Outlet />
      </main>

      <footer className="border-t border-slate-800/70 py-6">
        <div className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          © {new Date().getFullYear()} TalentTrack — Admin Portal
        </div>
      </footer>
    </div>
  );
}
