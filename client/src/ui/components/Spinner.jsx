// client/src/ui/components/Spinner.jsx
import React from "react";
import clsx from "clsx";

export default function Spinner({ size = 18, className }) {
  return (
    <span
      className={clsx(
        "inline-block animate-spin rounded-full border-2 border-white/20 border-t-white/80",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
