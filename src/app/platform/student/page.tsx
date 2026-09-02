"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PSectionTitle, PStatCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { StudentUser } from "@/platform/types";
import { labs, subjects } from "@/platform/data/labs";
import { getBadge } from "@/platform/data/badges";
import { levelFromXp, xpToday } from "@/platform/lib/gamification";

const subjectEmoji: Record<string, string> = {
  Maths: "🧮",
  Science: "🧪",
  English: "📖",
  Telugu: "✍️",
  "Social Studies": "🌍",
};

function StudentOverview() {
  const { state, currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const level = levelFromXp(student.xp);

  const myAssignments = state.assignments.filter(
    (a) => a.schoolId === student.schoolId && a.classNum === student.classNum && a.section === student.section
  );
  const mySubs = state.submissions.filter((s) => s.studentId === student.id);
  const pendingCount = myAssignments.filter((a) => {
    const sub = mySubs.find((s) => s.assignmentId === a.id);
    return !sub || sub.status === "pending";
  }).length;

  const announcements = state.announcements
    .filter(
      (a) =>
        a.schoolId === student.schoolId &&
        (a.audience === "school" || (a.classNum === student.classNum && a.section === student.section))
    )
    .slice(0, 3);

  const nextLab = labs.find((l) => l.status === "published" && !student.completedLabIds.includes(l.id));

  return (
    <div>
      <PSectionTitle
        title={`Hi ${student.name.split(" ")[0]}! 👋`}
        subtitle={`Class ${student.classNum}${student.section} · Ready to learn something new today?`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PStatCard label="Total XP" value={student.xp} emoji="⭐" tone="accent" sub={`+${xpToday(student.xp)} today`} />
        <PStatCard label="Level" value={level.level} emoji="🚀" tone="primary" sub={`${level.progressPct}% to next`} />
        <PStatCard label="Day Streak" value={student.streakDays} emoji="🔥" tone="pink" />
        <PStatCard label="Pending Work" value={pendingCount} emoji="📝" tone="secondary" />
      </div>

      {nextLab && (
        <PCard className="mt-6 flex flex-col items-center justify-between gap-4 bg-[linear-gradient(135deg,var(--p-primary-soft),var(--p-secondary-soft))] sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{nextLab.targetEmoji}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--p-primary-dark)]">
                Continue Learning
              </p>
              <p className="font-extrabold text-[var(--p-ink)]">
                {nextLab.subject} · {nextLab.topic}
              </p>
            </div>
          </div>
          <PButton href={`/platform/student/labs/${nextLab.id}`}>Start Lab →</PButton>
        </PCard>
      )}

      <PSectionTitle title="Your Subjects" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const count = labs.filter((l) => l.subject === subject && l.status === "published").length;
          const done = labs.filter(
            (l) => l.subject === subject && student.completedLabIds.includes(l.id)
          ).length;
          return (
            <Link key={subject} href={`/platform/student/labs?subject=${encodeURIComponent(subject)}`}>
              <PCard className="flex items-center gap-4 transition-transform hover:-translate-y-1">
                <span className="text-3xl">{subjectEmoji[subject]}</span>
                <div className="flex-1">
                  <p className="font-extrabold text-[var(--p-ink)]">{subject}</p>
                  <p className="text-xs text-[var(--p-muted)]">
                    {done}/{count} labs completed
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--p-bg-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--p-primary)]"
                      style={{ width: `${count ? (done / count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </PCard>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <PSectionTitle title="Class Announcements" />
          <div className="flex flex-col gap-3">
            {announcements.length === 0 && <PCard>No announcements yet.</PCard>}
            {announcements.map((a) => (
              <PCard key={a.id}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[var(--p-ink)]">{a.title}</p>
                  <PBadgePill tone={a.audience === "school" ? "accent" : "primary"}>
                    {a.audience === "school" ? "School" : "Class"}
                  </PBadgePill>
                </div>
                <p className="mt-1 text-sm text-[var(--p-ink-soft)]">{a.body}</p>
                <p className="mt-2 text-xs text-[var(--p-muted)]">— {a.authorName}</p>
              </PCard>
            ))}
          </div>
        </div>
        <div>
          <PSectionTitle title="Badges Earned" />
          <PCard>
            {student.badges.length === 0 ? (
              <p className="text-sm text-[var(--p-muted)]">
                Complete your first lab to earn a badge!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {student.badges.map((id) => {
                  const badge = getBadge(id);
                  return (
                    <PBadgePill key={id} tone="accent">
                      {badge ? `${badge.emoji} ${badge.name}` : id}
                    </PBadgePill>
                  );
                })}
              </div>
            )}
            <PButton href="/platform/student/progress" variant="secondary" size="sm" className="mt-4">
              View Full Progress →
            </PButton>
          </PCard>
        </div>
      </div>
    </div>
  );
}

export default function StudentOverviewPage() {
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <StudentOverview />
      </PlatformShell>
    </RoleGuard>
  );
}
