// client/src/ui/components/ToastBanner.jsx
import React from "react";
import clsx from "clsx";

const tones = {
  info: "bg-slate-900/35 border-slate-800/70 text-slate-200",
  success: "bg-emerald-500/10 border-emerald-400/25 text-emerald-200",
  warning: "bg-amber-500/10 border-amber-400/25 text-amber-200",
  danger: "bg-rose-500/10 border-rose-400/25 text-rose-200"
};

export default function ToastBanner({ tone = "info", title, children, className }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 text-sm",
        tones[tone] || tones.info,
        className
      )}
    >
      {title ? <div className="font-semibold">{title}</div> : null}
      {children ? <div className={title ? "mt-1 opacity-90" : ""}>{children}</div> : null}
    </div>
  );
}
