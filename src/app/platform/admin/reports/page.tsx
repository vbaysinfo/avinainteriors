"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PButton, PCard, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AdminUser } from "@/platform/types";
import { downloadCsv } from "@/platform/lib/csv";
import { getSchool } from "@/platform/data/schools";
import { FileSpreadsheet } from "lucide-react";

function avgFor(state: ReturnType<typeof usePlatform>["state"], studentId: string) {
  const subs = state.submissions.filter((s) => s.studentId === studentId && s.status === "graded");
  if (subs.length === 0) return "";
  return Math.round(
    subs.reduce((sum, s) => {
      const a = state.assignments.find((x) => x.id === s.assignmentId);
      return sum + (a && s.score !== undefined ? (s.score / a.maxScore) * 100 : 0);
    }, 0) / subs.length
  );
}

function ReportsView() {
  const { state, currentUser } = usePlatform();
  const admin = currentUser as AdminUser;
  const school = getSchool(admin.schoolId);

  const exportStudents = () => {
    const students = state.students.filter((s) => s.schoolId === admin.schoolId);
    downloadCsv(
      `${school?.name ?? "school"}-students.csv`,
      students.map((s) => ({
        Name: s.name,
        Class: `${s.classNum}${s.section}`,
        XP: s.xp,
        Streak: s.streakDays,
        "Avg Score %": avgFor(state, s.id),
        Badges: s.badges.length,
      }))
    );
  };

  const exportTeachers = () => {
    const teachers = state.teachers.filter((t) => t.schoolId === admin.schoolId);
    downloadCsv(
      `${school?.name ?? "school"}-teachers.csv`,
      teachers.map((t) => ({
        Name: t.name,
        Subjects: t.subjects.join("; "),
        "Classes Handled": t.classesHandled.join("; "),
      }))
    );
  };

  const exportAssignments = () => {
    const assignments = state.assignments.filter((a) => a.schoolId === admin.schoolId);
    downloadCsv(
      `${school?.name ?? "school"}-assignments.csv`,
      assignments.map((a) => {
        const subs = state.submissions.filter((s) => s.assignmentId === a.id);
        return {
          Title: a.title,
          Subject: a.subject,
          Class: `${a.classNum}${a.section}`,
          Type: a.type,
          Submitted: subs.filter((s) => s.status !== "pending").length,
          Graded: subs.filter((s) => s.status === "graded").length,
          Total: subs.length,
        };
      })
    );
  };

  return (
    <div>
      <PSectionTitle title="Reports" subtitle="Export school-wide performance data for offline analysis." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Student Performance", desc: "Every student, XP, streaks and average scores.", action: exportStudents },
          { title: "Teacher Summary", desc: "Subjects, classes handled and grading load.", action: exportTeachers },
          { title: "Assignment Completion", desc: "Submission & grading status per assignment.", action: exportAssignments },
        ].map((r) => (
          <PCard key={r.title} className="flex flex-col items-start gap-3">
            <FileSpreadsheet className="h-8 w-8 text-[var(--p-primary)]" />
            <p className="font-extrabold text-[var(--p-ink)]">{r.title}</p>
            <p className="text-sm text-[var(--p-ink-soft)]">{r.desc}</p>
            <PButton size="sm" onClick={r.action}>
              Export CSV
            </PButton>
          </PCard>
        ))}
      </div>
      <p className="mt-6 text-xs text-[var(--p-muted)]">
        CSV opens directly in Excel/Sheets. A production build would also offer formatted PDF exports server-side.
      </p>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PlatformShell>
        <ReportsView />
      </PlatformShell>
    </RoleGuard>
  );
}
