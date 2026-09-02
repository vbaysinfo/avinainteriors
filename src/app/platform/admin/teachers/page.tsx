"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AdminUser } from "@/platform/types";

function hashTo(id: string, max: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % max;
}

function TeachersView() {
  const { state, currentUser } = usePlatform();
  const admin = currentUser as AdminUser;
  const teachers = state.teachers.filter((t) => t.schoolId === admin.schoolId);

  return (
    <div>
      <PSectionTitle title="Teachers" subtitle="Every teacher at your school, their subjects and performance." />
      <div className="overflow-x-auto rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-[var(--p-border)] text-left text-xs font-bold uppercase text-[var(--p-muted)]">
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Subjects</th>
              <th className="px-4 py-3">Classes</th>
              <th className="px-4 py-3">Class Average</th>
              <th className="px-4 py-3">Grading Turnaround</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const assignmentIds = new Set(state.assignments.filter((a) => a.teacherId === t.id).map((a) => a.id));
              const graded = state.submissions.filter((s) => assignmentIds.has(s.assignmentId) && s.status === "graded");
              const avg = graded.length
                ? Math.round(
                    graded.reduce((sum, s) => {
                      const a = state.assignments.find((x) => x.id === s.assignmentId);
                      return sum + (a && s.score !== undefined ? (s.score / a.maxScore) * 100 : 0);
                    }, 0) / graded.length
                  )
                : null;
              const turnaround = 1 + hashTo(t.id, 4);
              return (
                <tr key={t.id} className="border-b border-[var(--p-border)] last:border-0">
                  <td className="flex items-center gap-2 px-4 py-3 font-semibold text-[var(--p-ink)]">
                    <span>{t.avatarEmoji}</span> {t.name}
                  </td>
                  <td className="px-4 py-3">{t.subjects.join(", ")}</td>
                  <td className="px-4 py-3">{t.classesHandled.join(", ")}</td>
                  <td className="px-4 py-3">{avg !== null ? `${avg}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <PBadgePill tone={turnaround <= 2 ? "success" : "warn"}>{turnaround} day{turnaround > 1 ? "s" : ""}</PBadgePill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {teachers.length === 0 && <PCard className="mt-4">No teachers onboarded yet.</PCard>}
    </div>
  );
}

export default function AdminTeachersPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PlatformShell>
        <TeachersView />
      </PlatformShell>
    </RoleGuard>
  );
}
