// client/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";

function StatCard({ title, value, sub, to, accent = "purple" }) {
  const ring =
    accent === "emerald"
      ? "ring-1 ring-emerald-400/25 bg-emerald-500/10"
      : "ring-1 ring-purple-500/30 bg-purple-600/15";

  const inner = (
    <div className={`rounded-2xl border border-slate-800/70 bg-slate-900/35 p-5 hover:bg-slate-900/45 transition`}>
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {sub ? <div className="mt-2 text-xs text-slate-400">{sub}</div> : null}
      <div className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ring}`}>
        Quick view
      </div>
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    tests: 0,
    activeAssignments: 0,
    submissionsThisMonth: 0
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/admin/overview");
        if (!alive) return;
        setStats(res.data?.stats || stats);
      } catch {
        // fallback (best effort): count via list endpoints
        try {
          const [u, t, a, s] = await Promise.all([
            api.get("/admin/users"),
            api.get("/admin/tests"),
            api.get("/admin/assignments"),
            api.get("/admin/submissions")
          ]);
          if (!alive) return;
          const now = Date.now();
          const active = (a.data?.assignments || []).filter((x) => {
            const exp = x?.expiresAt ? new Date(x.expiresAt).getTime() : null;
            return exp ? exp > now && x.status !== "submitted" : x.status !== "submitted";
          }).length;

          setStats({
            users: (u.data?.users || []).length,
            tests: (t.data?.tests || []).length,
            activeAssignments: active,
            submissionsThisMonth: (s.data?.submissions || []).length
          });
        } catch {
          // keep defaults
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        <div className="text-sm text-slate-300">Admin Overview</div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight">
          Manage tests, assignments & results
        </div>
        <p className="mt-2 text-sm text-slate-300/90">
          Create tests using JSON, assign them to students, and track submissions — all inside{" "}
          <span className="font-semibold text-slate-100">TalentTrack</span>.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/admin/tests">
            <Button>Create / Manage Tests</Button>
          </Link>
          <Link to="/admin/assignments">
            <Button variant="secondary">Assign Tests</Button>
          </Link>
          <Link to="/admin/submissions">
            <Button variant="ghost">View Submissions</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Students"
          value={loading ? "…" : stats.users}
          sub="Total users (role=user)"
          to="/admin/assignments"
          accent="emerald"
        />
        <StatCard
          title="Tests"
          value={loading ? "…" : stats.tests}
          sub="Available test library"
          to="/admin/tests"
        />
        <StatCard
          title="Active Assignments"
          value={loading ? "…" : stats.activeAssignments}
          sub="Not expired + not submitted"
          to="/admin/assignments"
          accent="emerald"
        />
        <StatCard
          title="Submissions"
          value={loading ? "…" : stats.submissionsThisMonth}
          sub="Recent submissions"
          to="/admin/submissions"
        />
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        <div className="text-lg font-extrabold">Admin workflow</div>
        <ol className="mt-3 space-y-2 text-sm text-slate-300/90 list-decimal pl-5">
          <li>Create tests from JSON (Quiz / Coding / Mixed).</li>
          <li>Assign test to one or many students with expiry date/time.</li>
          <li>Students take test → submission saved → score computed.</li>
          <li>Results emailed to student and admin.</li>
        </ol>
      </div>
    </div>
  );
}
