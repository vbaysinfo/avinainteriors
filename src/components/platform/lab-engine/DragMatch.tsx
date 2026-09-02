"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LabContent } from "@/platform/types";
import { DraggableChip } from "@/components/platform/lab-engine/DraggableChip";
import { DropZone } from "@/components/platform/lab-engine/DropZone";
import { useDropZones } from "@/components/platform/lab-engine/dnd";
import { playSound } from "@/platform/lib/sound";

export function DragMatch({
  lab,
  onProgress,
  onComplete,
}: {
  lab: LabContent;
  onProgress: (done: number, total: number) => void;
  onComplete: (score: number, max: number) => void;
}) {
  const { registerZone, getZoneAtPoint } = useDropZones();
  const [placed, setPlaced] = useState<Record<string, string>>({}); // zoneId -> itemId
  const [errorZone, setErrorZone] = useState<string | null>(null);
  const [hint, setHint] = useState(lab.hints.default);
  const finishedRef = useRef(false);
  const total = lab.correctCombos.length;
  const maxPoints = lab.correctCombos.reduce((s, c) => s + c.points, 0);

  const handleDrop = (itemId: string, point: { x: number; y: number }) => {
    const zoneId = getZoneAtPoint(point.x, point.y);
    if (!zoneId || placed[zoneId]) return;
    const combo = lab.correctCombos.find((c) => c.combo[1] === zoneId);
    if (!combo) return;

    if (combo.combo[0] === itemId) {
      playSound("correct");
      const next = { ...placed, [zoneId]: itemId };
      setPlaced(next);
      setHint(combo.result);
      onProgress(Object.keys(next).length, total);
      if (Object.keys(next).length === total && !finishedRef.current) {
        finishedRef.current = true;
        setTimeout(() => onComplete(maxPoints, maxPoints), 700);
      }
    } else {
      playSound("incorrect");
      setErrorZone(zoneId);
      setHint(lab.hints.onWrong ?? lab.hints.default);
      setTimeout(() => setErrorZone(null), 450);
    }
  };

  const availableItems = lab.items.filter(
    (item) => !Object.values(placed).includes(item.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        key={hint}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--p-border)] bg-[var(--p-bg-soft)] p-4 text-sm font-semibold text-[var(--p-ink-soft)]"
      >
        {hint}
      </motion.div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">
          {lab.targetLabel}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {lab.correctCombos.map((combo) => {
            const zoneId = combo.combo[1];
            const targetItem = lab.items.find((i) => i.id === combo.combo[0]);
            const filledWith = placed[zoneId];
            return (
              <DropZone
                key={zoneId}
                id={zoneId}
                registerZone={registerZone}
                filled={!!filledWith}
                glow={errorZone === zoneId ? "error" : filledWith ? "success" : null}
                className={errorZone === zoneId ? "p-animate-shake" : ""}
              >
                {filledWith ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <span className="text-3xl">{targetItem?.emoji}</span>
                    <span className="mt-1 text-[10px] font-bold text-[var(--p-success)]">
                      {targetItem?.label}
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <span className="text-3xl">{targetItem?.emoji}</span>
                    <span className="mt-1 text-[10px] font-bold text-[var(--p-muted)]">?</span>
                  </div>
                )}
              </DropZone>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">Drag from here</p>
        <div className="flex flex-wrap gap-4">
          {availableItems.map((item) => (
            <DraggableChip key={item.id} item={item} size="sm" onDrop={(point) => handleDrop(item.id, point)} />
          ))}
          {availableItems.length === 0 && (
            <p className="text-sm text-[var(--p-muted)]">All matched — nice work! 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
