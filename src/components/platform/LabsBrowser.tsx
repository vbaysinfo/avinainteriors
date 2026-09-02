"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { usePlatform } from "@/platform/store";
import type { StudentUser } from "@/platform/types";
import { labs, subjects } from "@/platform/data/labs";
import { PBadgePill, PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";

const interactionEmoji: Record<string, string> = {
  "drag-mix": "🧪",
  "drag-to-count": "🔢",
  "drag-to-match": "🧩",
  "drag-to-sequence": "🔁",
  "drag-to-label": "🏷️",
};

export function LabsBrowser() {
  const params = useSearchParams();
  const { currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const [subjectFilter, setSubjectFilter] = useState(params.get("subject") ?? "All");

  const published = labs.filter((l) => l.status === "published");
  const filtered = published.filter((l) => subjectFilter === "All" || l.subject === subjectFilter);

  return (
    <div>
      <PSectionTitle
        title="Interactive Labs"
        subtitle="Drag, drop and play through every chapter. Unlimited retries — this is practice, not a test!"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...subjects].map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              subjectFilter === s
                ? "bg-[var(--p-primary)] text-white"
                : "bg-[var(--p-bg-soft)] text-[var(--p-ink-soft)] hover:bg-[var(--p-border)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <PEmptyState emoji="🧪" title="No labs here yet" body="Try another subject filter." />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lab, i) => {
          const completed = student.completedLabIds.includes(lab.id);
          const recommended = lab.classNum === student.classNum;
          return (
            <motion.div
              key={lab.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <PCard className="flex h-full flex-col gap-3">
                <div
                  className="flex h-28 items-center justify-center rounded-2xl text-5xl"
                  style={{ background: "linear-gradient(135deg,var(--p-primary-soft),var(--p-secondary-soft))" }}
                >
                  {lab.targetEmoji}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PBadgePill tone="primary">{lab.subject}</PBadgePill>
                  <PBadgePill tone="muted">Class {lab.classNum}</PBadgePill>
                  {recommended && <PBadgePill tone="accent">✨ For you</PBadgePill>}
                  {completed && <PBadgePill tone="success">✓ Completed</PBadgePill>}
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-[var(--p-ink)]">{lab.topic}</p>
                  <p className="text-xs text-[var(--p-muted)]">{lab.chapter}</p>
                  <p className="mt-1.5 text-sm text-[var(--p-ink-soft)]">{lab.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[var(--p-muted)]">
                  <span>
                    {interactionEmoji[lab.interactionType]} {lab.interactionType.replace(/-/g, " ")}
                  </span>
                  <span>⭐ {lab.xp} XP · ⏱ {lab.estMinutes}m</span>
                </div>
                <PButton href={`/platform/student/labs/${lab.id}`} className="w-full">
                  {completed ? "Play Again" : "Start Lab"}
                </PButton>
              </PCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
