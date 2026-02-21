// client/src/pages/user/TakeAssignment.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";
import Button from "@/ui/components/Button.jsx";
import toast from "react-hot-toast";
import clsx from "clsx";

/* ───── helpers ───── */

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtTime(totalSec) {
  if (totalSec <= 0) return "00:00:00";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Flatten all quiz questions and coding problems into a linear list of "items". */
function buildItemList(sections) {
  const items = [];
  (sections || []).forEach((section, sIdx) => {
    if (section.sectionType === "quiz") {
      (section.questions || []).forEach((q, qIdx) => {
        items.push({
          kind: "quiz",
          sectionIdx: sIdx,
          sectionTitle: section.title || "Quiz",
          questionIdx: qIdx,
          data: q
        });
      });
    } else if (section.sectionType === "coding") {
      (section.problems || []).forEach((p, pIdx) => {
        items.push({
          kind: "coding",
          sectionIdx: sIdx,
          sectionTitle: section.title || "Coding",
          problemIdx: pIdx,
          data: p
        });
      });
    }
  });
  return items;
}

/* ═══════════════════════════════════════════════════
   Timer Component
   ═══════════════════════════════════════════════════ */
function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const timerRef = useRef(null);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onExpire]);

  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  const urgent = remaining <= 60;

  return (
    <div className="flex items-center gap-3">
      {/* progress bar */}
      <div className="hidden sm:block w-28 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-1000",
            urgent ? "bg-rose-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={clsx(
          "font-mono text-sm font-bold tabular-nums",
          urgent ? "text-rose-400 animate-pulse" : "text-emerald-400"
        )}
      >
        {fmtTime(remaining)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Quiz Item UI
   ═══════════════════════════════════════════════════ */
function QuizItem({ item, answer, onAnswer }) {
  const q = item.data;
  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-400">{item.sectionTitle}</div>
      <div className="text-lg font-extrabold leading-snug">{q.question}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(q.options || []).map((opt, i) => {
          const selected = answer === opt;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onAnswer(opt)}
              className={clsx(
                "text-left rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                selected
                  ? "border-purple-500/60 bg-purple-600/15 text-purple-100 ring-2 ring-purple-500/25"
                  : "border-slate-800/70 bg-slate-950/20 text-slate-200 hover:bg-slate-900/30 hover:border-slate-700"
              )}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Coding Item UI  — with Run / Test / Custom Input
   ═══════════════════════════════════════════════════ */
function CodingItem({ item, answer, onAnswer, assignmentId, api }) {
  const p = item.data;
  const defaultLang = (p.languages || ["javascript", "python"])[0] || "javascript";
  const starterForLang = (lang) => p.starterCode?.[lang] || "";
  const current = answer || { language: defaultLang, code: starterForLang(defaultLang) };

  // When language changes and code is still the old starter (or empty), swap in new starter
  const handleLangSwitch = (lang) => {
    const oldStarter = starterForLang(current.language);
    const codeIsDefault = !current.code.trim() || current.code.trim() === oldStarter.trim();
    onAnswer({
      ...current,
      language: lang,
      code: codeIsDefault ? starterForLang(lang) : current.code
    });
  };

  const sampleCases = (p.testcases || []).filter((tc) => tc.isSample);

  // --- Run state ---
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState(null); // [{input, expectedOutput, actualOutput, passed, runtimeMs, error}]
  const [runMode, setRunMode] = useState(null); // "sample" | "custom"
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [activeTab, setActiveTab] = useState("testcases"); // "testcases" | "output" | "custom"

  // --- Run against sample testcases ---
  async function handleRunSample() {
    if (!current.code.trim()) { toast.error("Write some code first!"); return; }
    setRunning(true);
    setRunResults(null);
    setRunMode("sample");
    setActiveTab("output");
    try {
      const res = await api.post(`/me/assignments/${assignmentId}/run-code`, {
        problemId: p.id,
        language: current.language,
        sourceCode: current.code
      });
      setRunResults(res.data?.results || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Run failed");
      setRunResults(null);
    } finally {
      setRunning(false);
    }
  }

  // --- Run against custom input ---
  async function handleRunCustom() {
    if (!current.code.trim()) { toast.error("Write some code first!"); return; }
    setRunning(true);
    setRunResults(null);
    setRunMode("custom");
    setActiveTab("output");
    try {
      const res = await api.post(`/me/assignments/${assignmentId}/run-code`, {
        problemId: p.id,
        language: current.language,
        sourceCode: current.code,
        customInput
      });
      setRunResults(res.data?.results || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Run failed");
      setRunResults(null);
    } finally {
      setRunning(false);
    }
  }

  const passedCount = (runResults || []).filter((r) => r.passed).length;
  const totalCount = (runResults || []).length;

  return (
    <div className="space-y-4">
      {/* ── Problem header ── */}
      <div className="text-sm text-slate-400">{item.sectionTitle}</div>
      <div className="text-lg font-extrabold leading-snug">{p.title}</div>
      <p className="text-sm text-slate-300/90 whitespace-pre-wrap">{p.statement}</p>

      {/* ── Two-column layout: Problem info + Editor ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: formats + constraints */}
        <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-950/20 p-4">
          {p.inputFormat && (
            <div>
              <div className="text-xs font-semibold text-slate-200">Input Format</div>
              <div className="mt-1 text-xs text-slate-300/90 whitespace-pre-wrap">{p.inputFormat}</div>
            </div>
          )}
          {p.outputFormat && (
            <div>
              <div className="text-xs font-semibold text-slate-200">Output Format</div>
              <div className="mt-1 text-xs text-slate-300/90 whitespace-pre-wrap">{p.outputFormat}</div>
            </div>
          )}
          {p.constraints && (
            <div>
              <div className="text-xs font-semibold text-slate-200">Constraints</div>
              <div className="mt-1 text-xs text-slate-300/90 whitespace-pre-wrap">{p.constraints}</div>
            </div>
          )}
        </div>

        {/* RIGHT: language selector + code editor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Language:</span>
            {(p.languages || ["javascript", "python"]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLangSwitch(lang)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-semibold border transition",
                  current.language === lang
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
                    : "border-slate-800/70 bg-slate-950/20 text-slate-200 hover:bg-slate-900/30"
                )}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>

          <textarea
            value={current.code}
            onChange={(e) => onAnswer({ ...current, code: e.target.value })}
            placeholder={`Write your ${current.language} solution here...`}
            spellCheck={false}
            className="h-72 w-full rounded-xl border border-slate-800/80 bg-black/25 p-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 resize-y leading-relaxed"
          />

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunSample}
              disabled={running}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition",
                "bg-emerald-600/90 hover:bg-emerald-600 text-white",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                running && "opacity-60 cursor-not-allowed"
              )}
            >
              {running && runMode === "sample" ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/90" />
                  Running…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
                  Run Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setShowCustom(!showCustom); setActiveTab("custom"); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              Custom Input
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Bottom panel: Testcases / Output / Custom Input tabs ═══ */}
      <div className="rounded-xl border border-slate-800/70 bg-slate-950/20 overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-slate-800/70">
          {["testcases", "output", "custom"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px",
                activeTab === tab
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              {tab === "testcases" && `Sample Cases (${sampleCases.length})`}
              {tab === "output" && (
                <span className="inline-flex items-center gap-1.5">
                  Output
                  {runResults && runMode === "sample" && (
                    <span className={clsx(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      passedCount === totalCount && totalCount > 0
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    )}>
                      {passedCount}/{totalCount}
                    </span>
                  )}
                </span>
              )}
              {tab === "custom" && "Custom Input"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 max-h-80 overflow-auto">
          {/* ── Testcases tab ── */}
          {activeTab === "testcases" && (
            <div className="space-y-3">
              {sampleCases.length === 0 ? (
                <div className="text-xs text-slate-400">No sample testcases available.</div>
              ) : (
                sampleCases.map((tc, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800/70 bg-black/20 p-3">
                    <div className="text-[11px] font-semibold text-slate-300">Sample #{idx + 1}</div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input</div>
                        <pre className="mt-1 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 font-mono">{tc.input}</pre>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected Output</div>
                        <pre className="mt-1 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 font-mono">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Output tab ── */}
          {activeTab === "output" && (
            <div className="space-y-3">
              {running && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  Compiling and running your code…
                </div>
              )}
              {!running && !runResults && (
                <div className="text-xs text-slate-400">
                  Click <span className="font-semibold text-emerald-400">Run Code</span> to see results here.
                </div>
              )}
              {!running && runResults && runMode === "sample" && runResults.map((r, idx) => (
                <div key={idx} className={clsx(
                  "rounded-lg border p-3",
                  r.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      "text-xs font-bold",
                      r.passed ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {r.passed ? "✓ Passed" : "✗ Failed"} — Sample #{idx + 1}
                    </span>
                    {r.runtimeMs != null && (
                      <span className="text-[10px] text-slate-400 font-mono">{r.runtimeMs}ms</span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input</div>
                      <pre className="mt-1 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 font-mono max-h-24">{r.input}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected</div>
                      <pre className="mt-1 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 font-mono max-h-24">{r.expectedOutput}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Your Output</div>
                      <pre className={clsx(
                        "mt-1 overflow-auto rounded bg-black/40 p-2 text-xs font-mono max-h-24",
                        r.error ? "text-rose-400" : r.passed ? "text-emerald-300" : "text-amber-300"
                      )}>
                        {r.error || r.actualOutput || "(empty)"}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              {!running && runResults && runMode === "custom" && runResults.map((r, idx) => (
                <div key={idx} className="rounded-lg border border-sky-500/40 bg-sky-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">Custom Run</span>
                    {r.runtimeMs != null && (
                      <span className="text-[10px] text-slate-400 font-mono">{r.runtimeMs}ms</span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input</div>
                      <pre className="mt-1 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 font-mono max-h-24">{r.input}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Output</div>
                      <pre className={clsx(
                        "mt-1 overflow-auto rounded bg-black/40 p-2 text-xs font-mono max-h-24",
                        r.error ? "text-rose-400" : "text-emerald-300"
                      )}>
                        {r.error || r.actualOutput || "(empty)"}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Custom Input tab ── */}
          {activeTab === "custom" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">Enter your own input below, then click Run.</div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom input..."
                spellCheck={false}
                className="h-28 w-full rounded-lg border border-slate-800/80 bg-black/30 p-3 font-mono text-xs text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 resize-y"
              />
              <button
                type="button"
                onClick={handleRunCustom}
                disabled={running}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition",
                  "bg-sky-600/90 hover:bg-sky-600 text-white",
                  running && "opacity-60 cursor-not-allowed"
                )}
              >
                {running && runMode === "custom" ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/90" />
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
                    Run with Custom Input
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Question Navigator (sidebar dots)
   ═══════════════════════════════════════════════════ */
function QuestionNav({ items, currentIdx, quizAnswers, codingAnswers, onJump }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => {
        const answered =
          item.kind === "quiz"
            ? !!quizAnswers[item.data.id]
            : !!(codingAnswers[item.data.id]?.code?.trim());
        const active = idx === currentIdx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onJump(idx)}
            title={`Q${idx + 1}${answered ? " (answered)" : ""}`}
            className={clsx(
              "h-8 w-8 rounded-lg text-xs font-bold transition-all",
              active
                ? "bg-emerald-500 text-white ring-2 ring-emerald-400/30"
                : answered
                  ? "bg-purple-600/30 text-purple-200 ring-1 ring-purple-500/30"
                  : "bg-slate-800/50 text-slate-300 ring-1 ring-slate-700/60 hover:bg-slate-700/50"
            )}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function TakeAssignment() {
  const { assignmentId } = useParams();
  const nav = useNavigate();
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [test, setTest] = useState(null);

  // quiz answers: { [questionId]: "selectedOption" }
  const [quizAnswers, setQuizAnswers] = useState({});
  // coding answers: { [problemId]: { language, code } }
  const [codingAnswers, setCodingAnswers] = useState({});

  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  /* ── load assignment ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/me/assignments/${assignmentId}`);
        if (!alive) return;
        setAssignment(res.data?.assignment || null);
        setTest(res.data?.test || null);
      } catch (e) {
        toast.error(e?.response?.data?.error || "Failed to load assignment");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [api, assignmentId]);

  /* ── flat item list ── */
  const items = useMemo(() => buildItemList(test?.sections), [test]);
  const totalItems = items.length;

  /* ── timer seconds ── */
  const timerSeconds = useMemo(() => {
    const mins =
      assignment?.effectiveConfig?.durationMinutes ??
      test?.metadata?.durationMinutes ??
      30;
    return mins * 60;
  }, [assignment, test]);

  /* ── auto-start assignment on first action ── */
  const handleStart = useCallback(async () => {
    try {
      await api.post(`/me/assignments/${assignmentId}/start`);
      setStarted(true);
    } catch (e) {
      // already started is fine
      if (e?.response?.status === 400) {
        setStarted(true);
      } else {
        toast.error(e?.response?.data?.error || "Failed to start assignment");
      }
    }
  }, [api, assignmentId]);

  /* ── navigation ── */
  function goPrev() {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setCurrentIdx((i) => Math.min(totalItems - 1, i + 1));
  }
  function jumpTo(idx) {
    setCurrentIdx(idx);
  }

  /* ── answer handlers ── */
  function handleQuizAnswer(questionId, option) {
    setQuizAnswers((p) => ({ ...p, [questionId]: option }));
  }
  function handleCodingAnswer(problemId, value) {
    setCodingAnswers((p) => ({ ...p, [problemId]: value }));
  }

  /* ── submit ── */
  async function submit() {
    if (!assignmentId) return;
    setSubmitting(true);
    const tId = toast.loading("Submitting…");
    try {
      // Transform quizAnswers object to array format expected by backend
      const quizAnswersArray = Object.entries(quizAnswers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      // Transform codingAnswers object to array format expected by backend
      const codingArray = Object.entries(codingAnswers).map(([problemId, value]) => ({
        problemId,
        language: value.language,
        sourceCode: value.code
      }));

      await api.post(`/me/assignments/${assignmentId}/submit`, {
        quizAnswers: quizAnswersArray,
        coding: codingArray
      });
      toast.success("Submitted! Results will be emailed too.", { id: tId });
      nav("/results");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Submit failed", { id: tId });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── auto-submit on timer expire ── */
  const autoSubmit = useCallback(() => {
    toast("Time's up! Auto-submitting…", { icon: "⏰" });
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, quizAnswers, codingAnswers]);

  /* ── stats ── */
  const answeredCount = useMemo(() => {
    let count = 0;
    items.forEach((item) => {
      if (item.kind === "quiz" && quizAnswers[item.data.id]) count++;
      if (item.kind === "coding" && codingAnswers[item.data.id]?.code?.trim()) count++;
    });
    return count;
  }, [items, quizAnswers, codingAnswers]);

  /* ═══════════════════════════════════ LOADING ═══ */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6">
        <div className="text-lg font-semibold">Test not available</div>
        <div className="mt-2 text-sm text-slate-300">
          This assignment may be invalid or expired.
        </div>
      </div>
    );
  }

  const title = test?.metadata?.title || "Untitled Test";
  const testType = test?.metadata?.type || "quiz";
  const duration =
    assignment?.effectiveConfig?.durationMinutes ??
    test?.metadata?.durationMinutes ??
    "—";

  /* ═══════════════════════════════ PRE-START SCREEN ═══ */
  if (!started && assignment?.status !== "in_progress" && assignment?.status !== "submitted") {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-12">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-8 text-center space-y-4">
          <div className="text-3xl font-extrabold tracking-tight">{title}</div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-300">
            <span className="rounded-full bg-slate-800/60 px-3 py-1 ring-1 ring-slate-700/50">
              {testType.charAt(0).toUpperCase() + testType.slice(1)}
            </span>
            <span className="rounded-full bg-slate-800/60 px-3 py-1 ring-1 ring-slate-700/50">
              {duration} min
            </span>
            <span className="rounded-full bg-slate-800/60 px-3 py-1 ring-1 ring-slate-700/50">
              {totalItems} question{totalItems !== 1 ? "s" : ""}
            </span>
          </div>

          {assignment?.expiresAt && (
            <div className="text-xs text-slate-400">
              Expires: {new Date(assignment.expiresAt).toLocaleString()}
            </div>
          )}

          <div className="pt-2 space-y-2 text-sm text-slate-300">
            <p>Once you start, the timer will begin counting down.</p>
            <p>You can navigate between questions using Prev/Next buttons.</p>
            <p>The test auto-submits when time runs out.</p>
          </div>

          <Button className="mt-4 px-8 py-3 text-base" onClick={handleStart}>
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════ MAIN TEST UI ═══ */
  const currentItem = items[currentIdx];
  if (!currentItem) {
    return (
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6 text-sm text-slate-300">
        No questions found in this test.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Top bar: title + timer ── */}
      <div className="sticky top-0 z-30 rounded-2xl border border-slate-800/70 bg-slate-950/80 backdrop-blur px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">{title}</div>
            <div className="mt-0.5 text-xs text-slate-400">
              Question {currentIdx + 1} of {totalItems} •{" "}
              <span className="text-slate-200">{answeredCount}/{totalItems} answered</span>
            </div>
          </div>
          <Timer totalSeconds={timerSeconds} onExpire={autoSubmit} />
        </div>
      </div>

      {/* ── Question navigator ── */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 px-5 py-3">
        <QuestionNav
          items={items}
          currentIdx={currentIdx}
          quizAnswers={quizAnswers}
          codingAnswers={codingAnswers}
          onJump={jumpTo}
        />
      </div>

      {/* ── Current question ── */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6 min-h-[320px]">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            {currentItem.kind === "quiz" ? "Quiz" : "Coding"} •{" "}
            {currentItem.sectionTitle}
          </span>
          <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-slate-700/50">
            {currentIdx + 1}/{totalItems}
          </span>
        </div>

        {currentItem.kind === "quiz" ? (
          <QuizItem
            item={currentItem}
            answer={quizAnswers[currentItem.data.id]}
            onAnswer={(opt) => handleQuizAnswer(currentItem.data.id, opt)}
          />
        ) : (
          <CodingItem
            item={currentItem}
            answer={codingAnswers[currentItem.data.id]}
            onAnswer={(val) => handleCodingAnswer(currentItem.data.id, val)}
            assignmentId={assignmentId}
            api={api}
          />
        )}
      </div>

      {/* ── Bottom bar: prev / next / submit ── */}
      <div className="sticky bottom-3 z-20">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 backdrop-blur px-5 py-3 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="px-4"
          >
            ← Prev
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="tabular-nums">
              {answeredCount}/{totalItems} answered
            </span>
            {answeredCount === totalItems && (
              <span className="text-emerald-400 font-semibold">✓ All done</span>
            )}
          </div>

          {currentIdx < totalItems - 1 ? (
            <Button
              variant="secondary"
              onClick={goNext}
              className="px-4"
            >
              Next →
            </Button>
          ) : (
            <Button
              loading={submitting}
              onClick={submit}
              className="px-6"
            >
              Submit Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
