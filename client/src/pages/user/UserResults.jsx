// client/src/pages/user/UserResults.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";

export default function UserResults() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/me/submissions");
        if (!alive) return;
        setItems(res.data?.submissions || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [api]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x?.testTitle || x?.test?.metadata?.title || "").toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Results</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Your submitted tests and scores.
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search results..."
          className="w-full sm:w-72 rounded-xl border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 overflow-hidden">
        <div className="grid grid-cols-12 border-b border-slate-800/70 px-4 py-3 text-xs font-semibold text-slate-300">
          <div className="col-span-6">Test</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Submitted</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300">Loading results…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">No submissions yet.</div>
        ) : (
          filtered.map((s) => {
            const title = s?.testTitle || s?.test?.metadata?.title || "Untitled";
            const type = s?.testType || s?.test?.metadata?.type || "quiz";
            const score = typeof s?.score === "number" ? s.score : (s?.summary?.score ?? "—");
            const maxScore = typeof s?.maxScore === "number" ? s.maxScore : (s?.summary?.maxScore ?? null);
            const scoreDisplay = maxScore !== null ? `${score}/${maxScore}` : score;
            const submittedAt = s?.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—";

            return (
              <div
                key={s._id || s.id}
                className="grid grid-cols-12 items-center border-b border-slate-800/40 px-4 py-4 last:border-b-0"
              >
                <div className="col-span-6">
                  <div className="font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {s?.summary?.details || ""}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-200/80">{type}</div>
                <div className="col-span-2 text-sm font-semibold text-slate-100">{scoreDisplay}</div>
                <div className="col-span-2 text-sm text-slate-200/80">{submittedAt}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
