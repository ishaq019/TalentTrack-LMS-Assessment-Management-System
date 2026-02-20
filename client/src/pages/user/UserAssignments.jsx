// client/src/pages/user/UserAssignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";

function pill(status) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "submitted") return `${base} bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25`;
  if (status === "expired") return `${base} bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25`;
  return `${base} bg-purple-600/20 text-purple-200 ring-1 ring-purple-500/30`;
}

export default function UserAssignments() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/me/assignments");
        if (!alive) return;

        const now = Date.now();
        const list = (res.data?.assignments || []).map((a) => {
          const exp = a?.expiresAt ? new Date(a.expiresAt).getTime() : null;
          const expired = exp ? exp <= now : false;
          const status =
            a?.status === "submitted" ? "submitted" : expired ? "expired" : "active";
          return { ...a, _status: status };
        });

        setItems(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [api]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = x?.testId?.metadata?.title || x?.test?.metadata?.title || x?.testTitle || "";
      return title.toLowerCase().includes(s);
    });
  }, [items, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Tests assigned by admin with expiry date.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assigned tests..."
            className="w-full sm:w-72 rounded-xl border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-slate-800/70 px-4 py-3 text-xs font-semibold text-slate-300">
          <div className="col-span-6">Test</div>
          <div className="col-span-3">Expires</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300">Loading assignments…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">No assignments found.</div>
        ) : (
          filtered.map((a) => {
            const title = a?.testId?.metadata?.title || a?.test?.metadata?.title || a?.testTitle || "Untitled Test";
            const expiresAt = a?.expiresAt ? new Date(a.expiresAt) : null;
            const expiresStr = expiresAt ? expiresAt.toLocaleString() : "—";
            const status = a?._status || "active";

            return (
              <div
                key={a._id || a.id}
                className="grid grid-cols-12 items-center gap-0 px-4 py-4 border-b border-slate-800/40 last:border-b-0"
              >
                <div className="col-span-6">
                  <div className="font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Type: {a?.testId?.metadata?.type || a?.test?.metadata?.type || a?.testType || "quiz"} •{" "}
                    Difficulty: {a?.testId?.metadata?.difficulty || a?.test?.metadata?.difficulty || "—"}
                  </div>
                </div>

                <div className="col-span-3 text-sm text-slate-200/80">{expiresStr}</div>

                <div className="col-span-2">
                  <span className={pill(status)}>{status.toUpperCase()}</span>
                </div>

                <div className="col-span-1 flex justify-end">
                  {status === "active" ? (
                    <Link to={`/take/${a._id || a.id}`}>
                      <Button className="px-3 py-2 text-xs">Start</Button>
                    </Link>
                  ) : status === "submitted" ? (
                    <Link to="/results">
                      <Button variant="secondary" className="px-3 py-2 text-xs">
                        View
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" className="px-3 py-2 text-xs" disabled>
                      Closed
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-xs text-slate-400">
        Tip: If you want **notifications**, we’ll show them in-app + email you on assignment.
      </div>
    </div>
  );
}
