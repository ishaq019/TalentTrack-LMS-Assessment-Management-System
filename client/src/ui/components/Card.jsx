// client/src/ui/components/Card.jsx
import React from "react";
import clsx from "clsx";

export default function Card({ title, subtitle, actions, className, children }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-800/70 bg-slate-900/35 p-6",
        className
      )}
    >
      {(title || subtitle || actions) ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <div className="text-lg font-extrabold">{title}</div> : null}
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-300/90">{subtitle}</div>
            ) : null}
          </div>
          {actions ? <div className="flex gap-2">{actions}</div> : null}
        </div>
      ) : null}

      {children ? <div className={title || subtitle ? "mt-5" : ""}>{children}</div> : null}
    </div>
  );
}
