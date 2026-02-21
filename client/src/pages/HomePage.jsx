// client/src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

/* ────────── tiny icons (inline SVG to avoid extra deps) ────────── */
const IconCode = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25M6.75 17.25L1.5 12l5.25-5.25M14.25 3.75l-4.5 16.5" />
  </svg>
);
const IconClipboard = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
  </svg>
);
const IconChart = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const IconShield = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const FEATURES = [
  {
    icon: <IconClipboard />,
    title: "Quiz Assessments",
    desc: "Multiple-choice and short-answer quizzes with automatic scoring and instant feedback."
  },
  {
    icon: <IconCode />,
    title: "Coding Challenges",
    desc: "Write, run, and test real code in the browser with a built-in editor and sandbox runner."
  },
  {
    icon: <IconChart />,
    title: "Analytics & Reports",
    desc: "Track progress with detailed score breakdowns, monthly reports, and performance trends."
  },
  {
    icon: <IconShield />,
    title: "Secure & Role-Based",
    desc: "JWT auth, OTP email verification, and separate admin / user dashboards."
  }
];

export default function HomePage() {
  const { isReady, isAuthed, user } = useAuth();

  const dashboardPath =
    isAuthed && user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* ───── Navbar ───── */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/80 border-b border-slate-800/60">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="text-violet-400">🎓</span> TalentTrack
          </Link>

          <nav className="flex items-center gap-3">
            {isReady && isAuthed ? (
              <Link
                to={dashboardPath}
                className="rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-semibold transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-700 hover:border-violet-500 px-5 py-2 text-sm font-semibold transition"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-semibold transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-10">
        {/* Decorative gradient blob */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-violet-600/20 to-indigo-600/10 blur-3xl" />
        </div>

        <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl">
          Assess Talent,{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Elevate Skills
          </span>
        </h1>

        <p className="relative mt-6 max-w-xl text-lg text-slate-400 leading-relaxed">
          A full-stack Learning Management &amp; Assessment platform for quizzes,
          coding tests, assignments, submissions, and reporting — built for
          teams and training programs.
        </p>

        <div className="relative mt-10 flex flex-wrap justify-center gap-4">
          {isReady && isAuthed ? (
            <Link
              to={dashboardPath}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-8 py-3 text-base font-semibold shadow-glow transition"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-8 py-3 text-base font-semibold shadow-glow transition"
              >
                Get Started — Free
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-700 hover:border-violet-500 px-8 py-3 text-base font-semibold transition"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">
          Everything you need to{" "}
          <span className="text-violet-400">evaluate &amp; grow</span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-violet-600/50 transition"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-slate-800/60 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TalentTrack — Built with React, Node.js &amp; MongoDB
      </footer>
    </div>
  );
}
