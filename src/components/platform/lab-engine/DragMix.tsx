"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LabContent } from "@/platform/types";
import { DraggableChip } from "@/components/platform/lab-engine/DraggableChip";
import { useDropZones } from "@/components/platform/lab-engine/dnd";
import { playSound } from "@/platform/lib/sound";

const BEAKER_ID = "beaker";

export function DragMix({
  lab,
  onProgress,
  onComplete,
}: {
  lab: LabContent;
  onProgress: (done: number, total: number) => void;
  onComplete: (score: number, max: number) => void;
}) {
  const { registerZone, getZoneAtPoint } = useDropZones();
  const [beaker, setBeaker] = useState<string[]>([]);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("Drag two ingredients into the beaker to react them.");
  const [tone, setTone] = useState<"idle" | "success" | "error">("idle");
  const [shake, setShake] = useState(false);
  const finishedRef = useRef(false);
  const total = lab.correctCombos.length;
  const maxPoints = lab.correctCombos.reduce((sum, c) => sum + c.points, 0);

  const comboKey = (ids: string[]) => [...ids].sort().join("+");

  const evaluate = (nextBeaker: string[]) => {
    const combo = lab.correctCombos.find((c) => comboKey(c.combo) === comboKey(nextBeaker));
    if (combo) {
      playSound("correct");
      setTone("success");
      setMessage(`${combo.result}${combo.detail ? ` — ${combo.detail}` : ""}`);
      const wasNew = !discovered.has(comboKey(combo.combo));
      const nextDiscovered = new Set(discovered);
      nextDiscovered.add(comboKey(combo.combo));
      setDiscovered(nextDiscovered);
      onProgress(nextDiscovered.size, total);
      if (wasNew && nextDiscovered.size === total && !finishedRef.current) {
        finishedRef.current = true;
        const earned = lab.correctCombos.reduce((s, c) => s + c.points, 0);
        setTimeout(() => onComplete(earned, maxPoints), 900);
      }
    } else {
      playSound("incorrect");
      setTone("error");
      setMessage(lab.hints.onWrong ?? lab.hints.default);
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    setTimeout(() => setBeaker([]), 750);
  };

  const handleDrop = (itemId: string, point: { x: number; y: number }) => {
    const zone = getZoneAtPoint(point.x, point.y);
    if (zone !== BEAKER_ID) return;
    if (beaker.includes(itemId)) return;
    playSound("drop");
    const next = [...beaker, itemId];
    setBeaker(next);
    if (next.length === 2) evaluate(next);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          ref={(el) => registerZone(BEAKER_ID, el)}
          className={`relative flex h-56 w-44 flex-col items-center justify-end overflow-hidden rounded-b-[2.5rem] rounded-t-xl border-4 border-[var(--p-ink)]/10 bg-white/60 pb-2 ${
            shake ? "p-animate-shake" : ""
          }`}
        >
          <span className="absolute top-3 text-4xl">{lab.targetEmoji}</span>
          <div className="flex w-full flex-1 items-end justify-center gap-2 pb-3">
            <AnimatePresence>
              {beaker.map((id) => {
                const it = lab.items.find((i) => i.id === id)!;
                return (
                  <motion.span
                    key={id}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    className="text-3xl"
                  >
                    {it.emoji}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
          <div
            className="h-8 w-full"
            style={{
              background:
                tone === "success"
                  ? "linear-gradient(90deg, var(--p-success), #86efac)"
                  : tone === "error"
                    ? "linear-gradient(90deg, var(--p-warn), #fde68a)"
                    : "linear-gradient(90deg, #c7d2fe, #a5b4fc)",
            }}
          />
        </div>
        <p className="text-xs font-bold text-[var(--p-muted)]">{lab.targetLabel}</p>
      </div>

      <div className="flex flex-col gap-4">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 text-sm font-semibold ${
            tone === "success"
              ? "border-[var(--p-success)] bg-[var(--p-success-soft)] text-[#166534]"
              : tone === "error"
                ? "border-[var(--p-warn)] bg-[var(--p-warn-soft)] text-[#946200]"
                : "border-[var(--p-border)] bg-[var(--p-bg-soft)] text-[var(--p-ink-soft)]"
          }`}
        >
          {message}
        </motion.div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">Ingredients</p>
        <div className="flex flex-wrap gap-4">
          {lab.items.map((item) => (
            <DraggableChip
              key={item.id}
              item={item}
              onDrop={(point) => handleDrop(item.id, point)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
