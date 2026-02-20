// client/src/pages/admin/AdminAssignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import toast from "react-hot-toast";
import clsx from "clsx";

function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-800/50 text-slate-200 ring-slate-700/60",
    purple: "bg-purple-600/15 text-purple-200 ring-purple-500/30",
    emerald: "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
    rose: "bg-rose-500/10 text-rose-200 ring-rose-400/25"
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>
      {children}
    </span>
  );
}

export default function AdminAssignments() {
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const [uq, setUq] = useState("");
  const [tq, setTq] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [u, t, a] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/tests"),
        api.get("/admin/assignments")
      ]);
      setUsers(u.data?.users || []);
      setTests(t.data?.tests || []);
      setAssignments(a.data?.assignments || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const s = uq.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => {
      const name = (u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  }, [users, uq]);

  const filteredTests = useMemo(() => {
    const s = tq.trim().toLowerCase();
    if (!s) return tests;
    return tests.filter((t) => (t?.metadata?.title || "").toLowerCase().includes(s));
  }, [tests, tq]);

  function toggleUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllFilteredUsers() {
    setSelectedUserIds(filteredUsers.map((u) => u._id));
  }

  function clearUsers() {
    setSelectedUserIds([]);
  }

  async function assign() {
    if (!selectedTestId) return toast.error("Select a test first.");
    if (selectedUserIds.length === 0) return toast.error("Select at least one student.");
    if (!expiresAt) return toast.error("Choose expiry date/time.");

    const tId = toast.loading("Assigning tests…");
    setBusy(true);
    try {
      await api.post("/admin/assignments", {
        testId: selectedTestId,
        userIds: selectedUserIds,
        expiresAt: new Date(expiresAt).toISOString()
      });

      toast.success("Assigned successfully", { id: tId });
      setSelectedUserIds([]);
      setSelectedTestId("");
      setExpiresAt("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Assignment failed", { id: tId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Assign Tests</h1>
          <p className="mt-1 text-sm text-slate-300/90">
            Select students, choose a test, set expiry, and assign.
          </p>
        </div>

        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Assignment form */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Tests */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/20 p-4">
            <div className="flex items-end justify-between gap-2">
              <div className="text-sm font-extrabold">Pick a Test</div>
              <Pill tone="slate">{filteredTests.length} tests</Pill>
            </div>

            <input
              value={tq}
              onChange={(e) => setTq(e.target.value)}
              placeholder="Search tests..."
              className="mt-3 w-full rounded-xl border border-slate-800/80 bg-black/25 px-3 py-2 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
            />

            <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
              {filteredTests.map((t) => {
                const id = t._id;
                const active = selectedTestId === id;
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setSelectedTestId(id)}
                    className={clsx(
                      "w-full text-left rounded-xl border px-3 py-2.5 text-sm transition",
                      active
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                        : "border-slate-800/70 bg-slate-950/20 text-slate-200 hover:bg-slate-900/30"
                    )}
                  >
                    <div className="font-semibold">{t?.metadata?.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {t?.metadata?.type} • {t?.metadata?.difficulty} • {t?.metadata?.durationMinutes}m
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Users */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/20 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold">Select Students</div>
                <div className="mt-1 text-xs text-slate-400">
                  Selected: <span className="font-semibold text-slate-200">{selectedUserIds.length}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="px-3 py-2 text-xs" onClick={selectAllFilteredUsers}>
                  Select All
                </Button>
                <Button variant="ghost" className="px-3 py-2 text-xs" onClick={clearUsers}>
                  Clear
                </Button>
              </div>
            </div>

            <input
              value={uq}
              onChange={(e) => setUq(e.target.value)}
              placeholder="Search students..."
              className="mt-3 w-full rounded-xl border border-slate-800/80 bg-black/25 px-3 py-2 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
            />

            <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-800/70">
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-300">No students found.</div>
              ) : (
                filteredUsers.map((u) => {
                  const checked = selectedUserIds.includes(u._id);
                  return (
                    <label
                      key={u._id}
                      className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-800/40 px-3 py-3 last:border-b-0 hover:bg-slate-900/25"
                    >
                      <div>
                        <div className="text-sm font-semibold">{u?.name || "Student"}</div>
                        <div className="text-xs text-slate-400">{u?.email}</div>
                      </div>

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(u._id)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Expiry date & time"
            hint="Students can’t submit after expiry"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={assign}
              loading={busy}
              disabled={busy || !selectedTestId || selectedUserIds.length === 0 || !expiresAt}
            >
              Assign Test
            </Button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          After submission, result email will be sent to both student and admin (backend responsibility).
        </div>
      </div>

      {/* Recent assignments */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
          <div className="text-sm font-extrabold">Recent Assignments</div>
          <Pill tone="slate">{assignments.length} total</Pill>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300">Loading assignments…</div>
        ) : assignments.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">No assignments yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {assignments.slice(0, 20).map((a) => {
              const title = a?.testId?.metadata?.title || a?.test?.metadata?.title || a?.testTitle || "Untitled";
              const email = a?.assignedTo?.email || a?.user?.email || a?.userEmail || "—";
              const exp = a?.expiresAt ? new Date(a.expiresAt).toLocaleString() : "—";
              const st = a?.status || "assigned";
              const tone = st === "submitted" ? "emerald" : st === "expired" ? "rose" : "purple";

              return (
                <div key={a._id || a.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{title}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Student: <span className="text-slate-200">{email}</span> • Expires:{" "}
                        <span className="text-slate-200">{exp}</span>
                      </div>
                    </div>

                    <Pill tone={tone}>{String(st).toUpperCase()}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
