// client/src/pages/admin/AdminTests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import toast from "react-hot-toast";
import clsx from "clsx";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-800/50 text-slate-200 ring-1 ring-slate-700/60">
      {children}
    </span>
  );
}

function parseJsonSafely(str) {
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch (e) {
    return { ok: false, error: "Invalid JSON format." };
  }
}

/**
 * Expected JSON formats supported:
 * 1) Single test object:
 *    { "metadata": {...}, "sections":[...] }
 *
 * 2) Bundle:
 *    { "tests": [ {test1}, {test2} ... ] }
 */
export default function AdminTests() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [q, setQ] = useState("");

  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/tests");
      setTests(res.data?.tests || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load tests");
      setTests([]);
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
    if (!s) return tests;
    return tests.filter((t) => {
      const title = t?.metadata?.title || "";
      const cat = t?.metadata?.category || "";
      const type = t?.metadata?.type || "";
      return (
        title.toLowerCase().includes(s) ||
        cat.toLowerCase().includes(s) ||
        type.toLowerCase().includes(s)
      );
    });
  }, [tests, q]);

  async function createFromJson() {
    const parsed = parseJsonSafely(jsonText.trim());
    if (!parsed.ok) return toast.error(parsed.error);

    const body = parsed.value;

    setBusy(true);
    const tId = toast.loading("Creating test(s)...");
    try {
      // Primary: /admin/tests supports both single and bundle (recommended)
      await api.post("/admin/tests", body);
      toast.success("Test(s) created", { id: tId });
      setJsonText("");
      await load();
    } catch (e) {
      // Fallback endpoint if your backend uses import route
      try {
        await api.post("/admin/tests/import-json", body);
        toast.success("Test(s) imported", { id: tId });
        setJsonText("");
        await load();
      } catch (e2) {
        toast.error(e2?.response?.data?.error || e?.response?.data?.error || "Create failed", {
          id: tId
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tests</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Manage the test library. Paste JSON to add new tests.
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tests..."
          className="w-full sm:w-72 rounded-xl border border-slate-800/80 bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
        />
      </div>

      {/* Create from JSON */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">Add Test via JSON</div>
            <div className="mt-1 text-sm text-slate-300/90">
              Supports <span className="font-semibold text-slate-100">single test</span> or{" "}
              <span className="font-semibold text-slate-100">bundle</span> format.
            </div>
          </div>

          <Button onClick={createFromJson} loading={busy} disabled={busy || !jsonText.trim()}>
            Import JSON
          </Button>
        </div>

        <div className="mt-4">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Paste JSON here...\n\nExample (single test):\n{\n  "metadata": { "title": "Aptitude 01", "type": "quiz" },\n  "sections": [ ... ]\n}\n\nExample (bundle):\n{ "tests": [ { ... }, { ... } ] }`}
            className="h-64 w-full rounded-xl border border-slate-800/80 bg-black/25 p-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
          />
          <div className="mt-2 text-xs text-slate-400">
            Tip: Keep correct answers inside JSON; frontend never computes truth — backend does.
          </div>
        </div>
      </div>

      {/* Tests list */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 overflow-hidden">
        <div className="grid grid-cols-12 border-b border-slate-800/70 px-4 py-3 text-xs font-semibold text-slate-300">
          <div className="col-span-6">Test</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Meta</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300">Loading tests…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">No tests found.</div>
        ) : (
          filtered.map((t) => {
            const title = t?.metadata?.title || "Untitled";
            const type = t?.metadata?.type || "—";
            const cat = t?.metadata?.category || "—";
            const diff = t?.metadata?.difficulty || "—";
            const mins = t?.metadata?.durationMinutes ?? "—";
            const practice = t?.metadata?.isPractice ? "practice" : "assigned";

            return (
              <div
                key={t._id || t.metadata?.id}
                className="grid grid-cols-12 items-center border-b border-slate-800/40 px-4 py-4 last:border-b-0"
              >
                <div className="col-span-6">
                  <div className="font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    ID: <span className="font-mono">{t?.metadata?.id || t._id}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <Badge>{type}</Badge>
                </div>

                <div className="col-span-2 text-sm text-slate-200/80">{cat}</div>

                <div className="col-span-2 flex flex-wrap justify-end gap-2">
                  <span
                    className={clsx(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                      practice === "practice"
                        ? "bg-purple-600/15 text-purple-200 ring-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
                    )}
                  >
                    {practice}
                  </span>
                  <Badge>{diff}</Badge>
                  <Badge>{mins}m</Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
