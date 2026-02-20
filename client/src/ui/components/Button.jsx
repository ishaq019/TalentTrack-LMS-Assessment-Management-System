import React from "react";
import clsx from "clsx";

const styles = {
  primary:
    "bg-purple-600/90 hover:bg-purple-600 text-white shadow-[0_12px_30px_rgba(124,58,237,0.25)]",
  secondary:
    "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700/60",
  danger:
    "bg-rose-600/90 hover:bg-rose-600 text-white shadow-[0_12px_30px_rgba(244,63,94,0.18)]",
  ghost:
    "bg-transparent hover:bg-slate-800/50 text-slate-100 border border-slate-800/70"
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-purple-500/30",
        "active:translate-y-[1px]",
        styles[variant] || styles.primary,
        isDisabled && "opacity-60 cursor-not-allowed active:translate-y-0",
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90" />
          <span>Processing…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
