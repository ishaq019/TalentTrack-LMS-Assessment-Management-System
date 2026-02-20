// client/src/pages/admin/AdminSubmissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";
import clsx from "clsx";
import toast from "react-hot-toast";

function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-800/50 text-slate-200 ring-slate-700/60",
    emerald: "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
    purple: "bg-purple-600/15 text-purple-200 ring-purple-500/30",
    rose: "bg-rose-500/10 text-rose-200 ring-rose-400/25"
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>
      {children}
    </span>
  );
}

export default function AdminSubmissions() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/submissions");
      setItems(res.data?.submissions || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load submissions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = (x?.testTitle || x?.test?.metadata?.title || "").toLowerCase();
      const email = (x?.userEmail || x?.user?.email || "").toLowerCase();
      return title.includes(s) || email.includes(s);
    });
  }, [items, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Submissions</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Review student submissions and scores.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by test or email..."
            className="w-full sm:w-72 rounded-xl border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
          />
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 overflow-hidden">
        <div className="grid grid-cols-12 border-b border-slate-800/70 px-4 py-3 text-xs font-semibold text-slate-300">
          <div className="col-span-4">Student</div>
          <div className="col-span-4">Test</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-1 text-right">When</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300">Loading submissions…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">No submissions found.</div>
        ) : (
          filtered.map((s) => {
            const email = s?.userEmail || s?.user?.email || "—";
            const name = s?.userName || s?.user?.name || "Student";
            const title = s?.testTitle || s?.test?.metadata?.title || "Untitled";
            const type = s?.testType || s?.test?.metadata?.type || "quiz";
            const score = typeof s?.score === "number" ? s.score : (s?.summary?.score ?? "—");
            const maxScore = typeof s?.maxScore === "number" ? s.maxScore : (s?.summary?.maxScore ?? null);
            const scoreDisplay = maxScore !== null ? `${score}/${maxScore}` : score;
            const when = s?.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—";

            const tone = type === "coding" ? "emerald" : type === "mixed" ? "purple" : "slate";

            return (
              <div
                key={s._id || s.id}
                className="grid grid-cols-12 items-center border-b border-slate-800/40 px-4 py-4 last:border-b-0"
              >
                <div className="col-span-4">
                  <div className="font-semibold">{name}</div>
                  <div className="mt-1 text-xs text-slate-400">{email}</div>
                </div>

                <div className="col-span-4">
                  <div className="font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {s?.assignmentId ? (
                      <>
                        Assignment:{" "}
                        <span className="font-mono">
                          {typeof s.assignmentId === "object"
                            ? s.assignmentId._id || JSON.stringify(s.assignmentId)
                            : s.assignmentId}
                        </span>
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <Pill tone={tone}>{type}</Pill>
                </div>

                <div className="col-span-1 font-semibold">{scoreDisplay}</div>

                <div className="col-span-1 text-right text-xs text-slate-400">
                  {when}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-xs text-slate-400">
        Want detailed per-question view? Add a backend endpoint:{" "}
        <span className="font-mono text-slate-200">GET /admin/submissions/:id</span> and we’ll render it.
      </div>
    </div>
  );
}
