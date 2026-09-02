"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LabContent } from "@/platform/types";
import { DraggableChip } from "@/components/platform/lab-engine/DraggableChip";
import { useDropZones } from "@/components/platform/lab-engine/dnd";
import { playSound } from "@/platform/lib/sound";

const BASKET_ID = "basket";

export function DragCount({
  lab,
  onProgress,
  onComplete,
}: {
  lab: LabContent;
  onProgress: (done: number, total: number) => void;
  onComplete: (score: number, max: number) => void;
}) {
  const { registerZone, getZoneAtPoint } = useDropZones();
  const target = lab.countTarget ?? 5;
  const baseItem = lab.items[0];
  const pool = useMemo(
    () => Array.from({ length: target }, (_, i) => `${baseItem.id}-${i}`),
    [baseItem.id, target]
  );
  const [remaining, setRemaining] = useState<string[]>(pool);
  const [dropped, setDropped] = useState<string[]>([]);
  const finishedRef = useRef(false);

  const handleDrop = (poolId: string, point: { x: number; y: number }) => {
    const zone = getZoneAtPoint(point.x, point.y);
    if (zone !== BASKET_ID) return;
    if (!remaining.includes(poolId)) return;
    playSound("correct");
    setRemaining((prev) => prev.filter((id) => id !== poolId));
    const next = [...dropped, poolId];
    setDropped(next);
    onProgress(next.length, target);
    if (next.length === target && !finishedRef.current) {
      finishedRef.current = true;
      setTimeout(() => onComplete(target, target), 700);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div
          ref={(el) => registerZone(BASKET_ID, el)}
          className="flex min-h-[10rem] w-full max-w-xs flex-wrap content-center items-center justify-center gap-1 rounded-[2rem] border-4 border-dashed border-[var(--p-accent)] bg-[var(--p-accent-soft)] p-4"
        >
          <AnimatePresence>
            {dropped.map((id) => (
              <motion.span
                key={id}
                initial={{ scale: 0, y: -30 }}
                animate={{ scale: 1, y: 0 }}
                className="text-3xl"
              >
                {baseItem.emoji}
              </motion.span>
            ))}
          </AnimatePresence>
          {dropped.length === 0 && <span className="text-4xl opacity-40">{lab.targetEmoji}</span>}
        </div>
        <p className="text-sm font-bold text-[var(--p-ink)]">{lab.targetLabel}</p>
        <motion.p
          key={dropped.length}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="text-4xl font-extrabold text-[var(--p-primary)]"
        >
          {dropped.length}
        </motion.p>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">
          Drag each {baseItem.label.toLowerCase()} into the {lab.targetLabel.toLowerCase()}
        </p>
        <div className="flex flex-wrap gap-4">
          {remaining.map((poolId) => (
            <DraggableChip
              key={poolId}
              item={baseItem}
              size="sm"
              onDrop={(point) => handleDrop(poolId, point)}
            />
          ))}
          {remaining.length === 0 && (
            <p className="text-sm text-[var(--p-muted)]">All counted — great job! 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
