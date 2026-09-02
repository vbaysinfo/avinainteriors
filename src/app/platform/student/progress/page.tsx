"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PSectionTitle, PStatCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import { getAllBadges } from "@/platform/store";
import type { StudentUser } from "@/platform/types";
import { labs, subjects } from "@/platform/data/labs";
import { levelFromXp } from "@/platform/lib/gamification";

const subjectEmoji: Record<string, string> = {
  Maths: "🧮",
  Science: "🧪",
  English: "📖",
  Telugu: "✍️",
  "Social Studies": "🌍",
};

function ProgressView() {
  const { currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const level = levelFromXp(student.xp);
  const badges = getAllBadges();

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div>
      <PSectionTitle title="Your Progress" subtitle="Subject-wise completion, streaks, XP and badges." />

      <div className="grid gap-4 sm:grid-cols-3">
        <PStatCard label="Total XP" value={student.xp} emoji="⭐" tone="accent" />
        <PStatCard label="Level" value={level.level} emoji="🚀" tone="primary" sub={`${level.xpIntoLevel}/${level.xpForNextLevel} XP`} />
        <PStatCard label="Labs Completed" value={student.completedLabIds.length} emoji="🧪" tone="secondary" />
      </div>

      <PSectionTitle title="Subject Completion" />
      <PCard className="flex flex-col gap-4">
        {subjects.map((subject) => {
          const total = labs.filter((l) => l.subject === subject && l.status === "published").length;
          const done = labs.filter((l) => l.subject === subject && student.completedLabIds.includes(l.id)).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={subject}>
              <div className="mb-1 flex items-center justify-between text-sm font-bold text-[var(--p-ink)]">
                <span>
                  {subjectEmoji[subject]} {subject}
                </span>
                <span className="text-[var(--p-muted)]">
                  {done}/{total}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--p-bg-soft)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--p-primary),var(--p-secondary))] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </PCard>

      <PSectionTitle title="This Week's Streak" />
      <PCard className="flex items-center justify-between gap-2">
        {days.map((d, i) => {
          const active = i >= 7 - student.streakDays;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                  active ? "bg-[var(--p-accent)] text-white" : "bg-[var(--p-bg-soft)] text-[var(--p-muted)]"
                }`}
              >
                {active ? "🔥" : "·"}
              </div>
              <span className="text-[10px] font-bold text-[var(--p-muted)]">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
            </div>
          );
        })}
      </PCard>

      <PSectionTitle title="Badge Collection" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {badges.map((badge) => {
          const earned = student.badges.includes(badge.id);
          return (
            <PCard key={badge.id} className={`text-center ${earned ? "" : "opacity-40 grayscale"}`}>
              <span className="text-4xl">{badge.emoji}</span>
              <p className="mt-2 text-sm font-extrabold text-[var(--p-ink)]">{badge.name}</p>
              <p className="mt-1 text-xs text-[var(--p-muted)]">{badge.description}</p>
              {earned && (
                <div className="mt-2">
                  <PBadgePill tone="success">Earned</PBadgePill>
                </div>
              )}
            </PCard>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentProgressPage() {
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <ProgressView />
      </PlatformShell>
    </RoleGuard>
  );
}
