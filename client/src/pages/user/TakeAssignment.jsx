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
   Coding Item UI
   ═══════════════════════════════════════════════════ */
function CodingItem({ item, answer, onAnswer }) {
  const p = item.data;
  const current = answer || { language: "javascript", code: "" };
  const sampleCases = (p.testcases || []).filter((tc) => tc.isSample);

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-400">{item.sectionTitle}</div>
      <div className="text-lg font-extrabold leading-snug">{p.title}</div>
      <p className="text-sm text-slate-300/90 whitespace-pre-wrap">{p.statement}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* left: formats + constraints + samples */}
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
          {sampleCases.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-200">Sample Testcases</div>
              <div className="mt-2 space-y-2">
                {sampleCases.map((tc, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800/70 bg-black/20 p-3">
                    <div className="text-[11px] text-slate-400">Sample #{idx + 1}</div>
                    <div className="mt-1 text-[11px]">
                      <span className="font-semibold text-slate-200">Input:</span>
                      <pre className="mt-1 overflow-auto rounded bg-black/30 p-2">{tc.input}</pre>
                    </div>
                    <div className="mt-1 text-[11px]">
                      <span className="font-semibold text-slate-200">Output:</span>
                      <pre className="mt-1 overflow-auto rounded bg-black/30 p-2">{tc.output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* right: language selector + editor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Language:</span>
            {(p.languages || ["javascript", "python"]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onAnswer({ ...current, language: lang })}
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
            className="h-72 w-full rounded-xl border border-slate-800/80 bg-black/25 p-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 resize-y"
          />
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
