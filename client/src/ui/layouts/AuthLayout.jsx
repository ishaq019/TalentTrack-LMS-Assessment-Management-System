// client/src/ui/layouts/AuthLayout.jsx
import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-purple-500/30">
                <span className="text-xl font-black text-purple-200">T</span>
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                Talent<span className="text-purple-300">Track</span>
              </span>
            </Link>

            <p className="mt-2 text-sm text-slate-300/90">
              LMS + Assessments (Quiz + Coding) in one place.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur">
            <Outlet />
          </div>

          {/* Footer */}
          <div className="mt-5 text-center text-xs text-slate-400">
            <p>
              By continuing, you agree to TalentTrack’s basic usage policy.
            </p>
            <p className="mt-1 opacity-70">© {new Date().getFullYear()} TalentTrack</p>
          </div>
        </div>
      </div>
    </div>
  );
}
