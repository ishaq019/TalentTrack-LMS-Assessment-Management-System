import React from "react";
import clsx from "clsx";

export default function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-end justify-between gap-3">
          <label className="text-sm font-semibold text-slate-200">{label}</label>
          {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
        </div>
      ) : null}

      <input
        {...props}
        className={clsx(
          "w-full rounded-xl border bg-slate-950/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition",
          "border-slate-800/80 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20",
          props.disabled && "opacity-60 cursor-not-allowed",
          error && "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/20",
          inputClassName
        )}
      />

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
