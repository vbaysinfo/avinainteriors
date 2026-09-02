"use client";

import { useState } from "react";

const COLORS = ["#6d5bfa", "#14b8a6", "#ff9f43", "#ff6b9d", "#22c55e", "#f5b942"];

export function Confetti({ count = 24 }: { count?: number }) {
  // Randomized exactly once via a lazy initializer (celebration overlays
  // are mounted fresh each time this shows) — unlike useMemo, useState's
  // initializer is guaranteed to run only once per mount, keeping render
  // itself pure.
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 0.9 + Math.random() * 0.6,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.round(Math.random() * 6),
      round: i % 3 === 0,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="p-confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: p.round ? "999px" : "3px",
          }}
        />
      ))}
    </div>
  );
}
