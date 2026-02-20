// client/src/pages/user/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";

function Card({ title, value, sub, to }) {
  const content = (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-5 hover:bg-slate-900/45 transition">
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {sub ? <div className="mt-2 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export default function UserDashboard() {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedActive: 0,
    assignedExpired: 0,
    practiceTakenThisMonth: 0,
    assignedTakenThisMonth: 0
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Expected backend: GET /user/dashboard
        // If not present, fallback derived from assignments endpoint.
        const res = await api.get("/me/dashboard");
        if (!alive) return;
        setStats(res.data?.stats || stats);
      } catch {
        // Fallback: try assignments
        try {
          const a = await api.get("/me/assignments");
          if (!alive) return;

          const now = Date.now();
          const items = a.data?.assignments || [];
          const active = items.filter((x) => x?.expiresAt && new Date(x.expiresAt).getTime() > now && x.status !== "submitted").length;
          const expired = items.filter((x) => x?.expiresAt && new Date(x.expiresAt).getTime() <= now && x.status !== "submitted").length;

          setStats((s) => ({
            ...s,
            assignedActive: active,
            assignedExpired: expired
          }));
        } catch {
          // keep defaults
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        <div className="text-sm text-slate-300">{greeting},</div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight">
          {user?.name || "Student"} 👋
        </div>
        <div className="mt-2 text-sm text-slate-300/90">
          Welcome to <span className="font-semibold text-slate-100">TalentTrack</span>.
          Your assignments and practice tests live here.
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/assignments">
            <Button>View Assignments</Button>
          </Link>
          <Link to="/practice">
            <Button variant="secondary">Practice Tests</Button>
          </Link>
          <Link to="/results">
            <Button variant="ghost">My Results</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Active Assignments"
          value={loading ? "…" : stats.assignedActive}
          sub="Tests you can still take"
          to="/assignments"
        />
        <Card
          title="Expired Assignments"
          value={loading ? "…" : stats.assignedExpired}
          sub="Missed deadline"
          to="/assignments"
        />
        <Card
          title="Practice This Month"
          value={loading ? "…" : stats.practiceTakenThisMonth}
          sub="Self practice tests"
          to="/practice"
        />
        <Card
          title="Assigned Taken This Month"
          value={loading ? "…" : stats.assignedTakenThisMonth}
          sub="Assigned submissions"
          to="/results"
        />
      </div>
    </div>
  );
}
