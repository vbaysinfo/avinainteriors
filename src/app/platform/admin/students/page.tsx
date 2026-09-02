"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AdminUser } from "@/platform/types";

function statusFor(avg: number | null) {
  if (avg === null) return { label: "No Data", tone: "muted" as const };
  if (avg >= 75) return { label: "Good", tone: "success" as const };
  if (avg >= 50) return { label: "Average", tone: "warn" as const };
  return { label: "Needs Attention", tone: "danger" as const };
}

function BulkImport({ schoolId }: { schoolId: string }) {
  const { addStudentsBulk } = usePlatform();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Aditi Sharma,3,A\nRavi Teja,3,A");
  const [added, setAdded] = useState(0);

  const doImport = () => {
    const rows = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, classNum, section] = line.split(",").map((v) => v.trim());
        return { name, classNum: Number(classNum), section: section || "A" };
      })
      .filter((r) => r.name && r.classNum >= 1 && r.classNum <= 10);
    if (rows.length === 0) return;
    addStudentsBulk(schoolId, rows);
    setAdded(rows.length);
    setTimeout(() => setAdded(0), 3000);
  };

  return (
    <PCard className="mb-6">
      <div className="flex items-center justify-between">
        <p className="font-extrabold text-[var(--p-ink)]">Bulk Import Students (CSV-style)</p>
        <PButton size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Open"}
        </PButton>
      </div>
      {open && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-[var(--p-muted)]">One student per line: Name,Class,Section</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="p-input font-mono text-xs" />
          <PButton size="sm" onClick={doImport} className="self-start">
            Import Students
          </PButton>
          {added > 0 && <p className="text-xs font-bold text-[var(--p-success)]">✓ Added {added} students</p>}
        </div>
      )}
    </PCard>
  );
}

function StudentsView() {
  const { state, currentUser } = usePlatform();
  const admin = currentUser as AdminUser;
  const [classFilter, setClassFilter] = useState<number | "all">("all");

  const allStudents = state.students.filter((s) => s.schoolId === admin.schoolId);
  const students = classFilter === "all" ? allStudents : allStudents.filter((s) => s.classNum === classFilter);

  const avgFor = (studentId: string) => {
    const subs = state.submissions.filter((s) => s.studentId === studentId && s.status === "graded");
    if (subs.length === 0) return null;
    return Math.round(
      subs.reduce((sum, s) => {
        const a = state.assignments.find((x) => x.id === s.assignmentId);
        return sum + (a && s.score !== undefined ? (s.score / a.maxScore) * 100 : 0);
      }, 0) / subs.length
    );
  };

  return (
    <div>
      <PSectionTitle
        title="Students"
        subtitle={`${allStudents.length} students across your school.`}
        action={
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="p-input w-auto"
          >
            <option value="all">All Classes</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        }
      />

      <BulkImport schoolId={admin.schoolId} />

      <div className="overflow-x-auto rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--p-border)] text-left text-xs font-bold uppercase text-[var(--p-muted)]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const avg = avgFor(s.id);
              const status = statusFor(avg);
              return (
                <tr key={s.id} className="border-b border-[var(--p-border)] last:border-0">
                  <td className="flex items-center gap-2 px-4 py-3 font-semibold text-[var(--p-ink)]">
                    <span>{s.avatarEmoji}</span> {s.name}
                  </td>
                  <td className="px-4 py-3">
                    {s.classNum}
                    {s.section}
                  </td>
                  <td className="px-4 py-3">{s.xp}</td>
                  <td className="px-4 py-3">{avg !== null ? `${avg}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <PBadgePill tone={status.tone}>{status.label}</PBadgePill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PlatformShell>
        <StudentsView />
      </PlatformShell>
    </RoleGuard>
  );
}
