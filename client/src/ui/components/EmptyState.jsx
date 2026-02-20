// client/src/ui/components/EmptyState.jsx
import React from "react";
import Button from "./Button.jsx";

export default function EmptyState({
  title = "Nothing here",
  description = "Try changing filters or come back later.",
  actionLabel,
  onAction
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/35 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/40 ring-1 ring-slate-700/60">
        <span className="text-xl">🗂️</span>
      </div>
      <div className="text-lg font-extrabold">{title}</div>
      <div className="mt-2 text-sm text-slate-300/90">{description}</div>

      {actionLabel && onAction ? (
        <div className="mt-5 flex justify-center">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
