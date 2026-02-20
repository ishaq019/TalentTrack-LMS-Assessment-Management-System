// client/src/pages/user/UserPractice.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";
import toast from "react-hot-toast";
import { PRACTICE_CATALOG } from "@/data/practiceCatalog.js";

export default function UserPractice() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await api.get("/me/practice-tests");
        if (!alive) return;
        const fetched = r.data?.tests || [];
        if (fetched.length > 0) {
          setTests(fetched);
        } else {
          // API returned empty — show static catalog as display-only
          setTests(PRACTICE_CATALOG.map((t) => ({ metadata: t })));
        }
      } catch {
        // Backend unreachable — fallback to catalog
        if (!alive) return;
        setTests(PRACTICE_CATALOG.map((t) => ({ metadata: t })));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [api]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tests;
    return tests.filter((t) => (t?.metadata?.title || "").toLowerCase().includes(s));
  }, [tests, q]);

  async function startPractice(test) {
    const testId = test?._id || test?.metadata?.id;

    const tId = toast.loading("Starting practice…");
    try {
      // Best practice: backend creates a practice session (assignment-like)
      // POST /user/practice/start { testId } -> { assignmentId }
      const res = await api.post("/me/practice/start", { testId });
      const assignmentId = res.data?.assignmentId;
      if (!assignmentId) throw new Error("No assignmentId returned");

      toast.success("Practice started!", { id: tId });
      window.location.href = `/take/${assignmentId}`;
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Failed to start practice. Please try again.",
        { id: tId }
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Practice</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Try sample tests to improve. These don’t require admin assignment.
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search practice tests..."
          className="w-full sm:w-72 rounded-xl border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="text-sm text-slate-300">Loading practice tests…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-300">No practice tests found.</div>
        ) : (
          filtered.map((t) => (
            <div
              key={t._id || t.metadata?.id}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-5"
            >
              <div className="text-xs text-slate-400">
                {t?.metadata?.category || "general"} • {t?.metadata?.difficulty || "—"}
              </div>
              <div className="mt-1 text-lg font-extrabold">{t?.metadata?.title}</div>
              <div className="mt-2 text-sm text-slate-300/90">
                Type: <span className="text-slate-100">{t?.metadata?.type}</span> • Duration:{" "}
                <span className="text-slate-100">{t?.metadata?.durationMinutes} min</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => startPractice(t)} className="w-full">
                  Start Practice
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-slate-400">
        Note: Practice scoring requires backend session creation. Until then, this list can still be used for UI validation.
      </div>
    </div>
  );
}
