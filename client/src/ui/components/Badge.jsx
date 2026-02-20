// client/src/ui/components/Badge.jsx
import React from "react";
import clsx from "clsx";

const tones = {
  slate: "bg-slate-800/50 text-slate-200 ring-slate-700/60",
  purple: "bg-purple-600/15 text-purple-200 ring-purple-500/30",
  emerald: "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
  rose: "bg-rose-500/10 text-rose-200 ring-rose-400/25",
  amber: "bg-amber-500/10 text-amber-200 ring-amber-400/25"
};

export default function Badge({ tone = "slate", className, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        tones[tone] || tones.slate,
        className
      )}
    >
      {children}
    </span>
  );
}
