"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function DropZone({
  id,
  registerZone,
  label,
  emoji,
  filled,
  glow,
  children,
  className = "",
}: {
  id: string;
  registerZone: (id: string, el: HTMLElement | null) => void;
  label?: string;
  emoji?: string;
  filled?: boolean;
  glow?: "success" | "error" | null;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      ref={(el) => registerZone(id, el)}
      data-zone-id={id}
      animate={
        glow === "success"
          ? { scale: [1, 1.08, 1], borderColor: "var(--p-success)" }
          : glow === "error"
            ? { borderColor: "var(--p-warn)" }
            : {}
      }
      className={`flex min-h-[6.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-3 text-center transition-colors ${
        filled
          ? "border-solid border-[var(--p-success)] bg-[var(--p-success-soft)]"
          : "border-[var(--p-border)] bg-[var(--p-bg-soft)]"
      } ${className}`}
    >
      {children ?? (
        <>
          {emoji && <span className="text-2xl">{emoji}</span>}
          {label && <span className="text-xs font-bold text-[var(--p-muted)]">{label}</span>}
        </>
      )}
    </motion.div>
  );
}
