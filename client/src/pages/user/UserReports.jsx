// client/src/pages/user/UserReports.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";
import toast from "react-hot-toast";

export default function UserReports() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/me/reports/monthly");
      setReport(res.data?.report || null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function emailMe() {
    const tId = toast.loading("Sending report email…");
    try {
      await api.post("/me/reports/monthly/email");
      toast.success("Report sent to your email!", { id: tId });
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to email report", { id: tId });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Monthly Report</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Summary of assigned tests and practice activity.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={emailMe} disabled={loading}>
            Email me
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        {loading ? (
          <div className="text-sm text-slate-300">Loading monthly report…</div>
        ) : !report ? (
          <div className="text-sm text-slate-300">
            No report available yet. (Backend generates it monthly or on-demand.)
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-300">
              Period:{" "}
              <span className="font-semibold text-slate-100">
                {report.monthName || report.month || "Current Month"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/25 p-4">
                <div className="text-xs text-slate-400">Assigned</div>
                <div className="mt-2 text-2xl font-extrabold">{report.assignedTotal ?? 0}</div>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/25 p-4">
                <div className="text-xs text-slate-400">Completed</div>
                <div className="mt-2 text-2xl font-extrabold">{report.assignedCompleted ?? 0}</div>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/25 p-4">
                <div className="text-xs text-slate-400">Practice Taken</div>
                <div className="mt-2 text-2xl font-extrabold">{report.practiceTaken ?? 0}</div>
              </div>
            </div>

            {Array.isArray(report.breakdown) && report.breakdown.length > 0 ? (
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/25 p-4">
                <div className="text-sm font-semibold">Breakdown</div>
                <div className="mt-2 space-y-2 text-sm text-slate-200/80">
                  {report.breakdown.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-300">{b.label}</span>
                      <span className="font-semibold text-slate-100">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
