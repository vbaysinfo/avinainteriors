"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { TeacherUser } from "@/platform/types";

function studentAverage(state: ReturnType<typeof usePlatform>["state"], studentId: string) {
  const subs = state.submissions.filter((s) => s.studentId === studentId && s.status === "graded");
  if (subs.length === 0) return null;
  const pct =
    subs.reduce((sum, s) => {
      const a = state.assignments.find((x) => x.id === s.assignmentId);
      return sum + (a && s.score !== undefined ? (s.score / a.maxScore) * 100 : 0);
    }, 0) / subs.length;
  return Math.round(pct);
}

function riskLevel(avg: number | null, streakDays: number) {
  if (avg !== null && avg < 50) return "critical";
  if (streakDays === 0 || (avg !== null && avg < 65)) return "warning";
  return "good";
}

function PerformanceView() {
  const { state, currentUser } = usePlatform();
  const teacher = currentUser as TeacherUser;
  const [classFilter, setClassFilter] = useState(teacher.classesHandled[0]);

  const classStudents = state.students.filter(
    (s) => s.schoolId === teacher.schoolId && s.classNum === classFilter
  );

  const rows = classStudents
    .map((s) => ({
      student: s,
      avg: studentAverage(state, s.id),
      risk: riskLevel(studentAverage(state, s.id), s.streakDays),
    }))
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const classAvg = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + (r.avg ?? 0), 0) / rows.length)
    : 0;

  return (
    <div>
      <PSectionTitle
        title="Student Performance"
        subtitle="Per-class and per-student analytics, with at-risk flags."
        action={
          <select value={classFilter} onChange={(e) => setClassFilter(Number(e.target.value))} className="p-input w-auto">
            {teacher.classesHandled.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        }
      />

      <PCard className="mb-6 flex items-center gap-4">
        <span className="text-3xl">📊</span>
        <div>
          <p className="text-2xl font-extrabold text-[var(--p-ink)]">{classAvg}%</p>
          <p className="text-xs font-bold uppercase text-[var(--p-muted)]">Class {classFilter} average score</p>
        </div>
      </PCard>

      <div className="overflow-x-auto rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--p-border)] text-left text-xs font-bold uppercase text-[var(--p-muted)]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, avg, risk }) => (
              <tr key={student.id} className="border-b border-[var(--p-border)] last:border-0">
                <td className="flex items-center gap-2 px-4 py-3 font-semibold text-[var(--p-ink)]">
                  <span>{student.avatarEmoji}</span> {student.name}
                </td>
                <td className="px-4 py-3">{avg !== null ? `${avg}%` : "—"}</td>
                <td className="px-4 py-3">{student.xp}</td>
                <td className="px-4 py-3">{student.streakDays}d</td>
                <td className="px-4 py-3">
                  <PBadgePill tone={risk === "critical" ? "danger" : risk === "warning" ? "warn" : "success"}>
                    {risk === "critical" ? "Needs Attention" : risk === "warning" ? "Average" : "Good"}
                  </PBadgePill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeacherPerformancePage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <PlatformShell>
        <PerformanceView />
      </PlatformShell>
    </RoleGuard>
  );
}
