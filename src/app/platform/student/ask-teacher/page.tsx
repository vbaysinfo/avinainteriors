"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { StudentUser, SubjectName } from "@/platform/types";
import { subjects } from "@/platform/data/labs";

function AskTeacherView() {
  const { state, askTeacher, currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const [subject, setSubject] = useState<SubjectName>("Science");
  const [message, setMessage] = useState("");

  const schoolTeachers = state.teachers.filter((t) => t.schoolId === student.schoolId);
  const teacherFor = (s: SubjectName) => schoolTeachers.find((t) => t.subjects.includes(s));

  const myDoubts = state.doubts
    .filter((d) => d.studentId === student.id)
    .sort((a, b) => +new Date(b.createdISO) - +new Date(a.createdISO));

  const handleSend = () => {
    const teacher = teacherFor(subject);
    if (!teacher || !message.trim()) return;
    askTeacher({
      schoolId: student.schoolId,
      studentId: student.id,
      teacherId: teacher.id,
      subject,
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div>
      <PSectionTitle title="Ask Teacher" subtitle="Stuck on something? Send a quick doubt to your subject teacher." />

      <PCard className="mb-6 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectName)} className="p-input">
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s} {teacherFor(s as SubjectName) ? `— ${teacherFor(s as SubjectName)!.name}` : "(no teacher yet)"}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Type your question here..."
          className="p-input"
        />
        <PButton onClick={handleSend} disabled={!message.trim()} className="self-start">
          Send to Teacher →
        </PButton>
      </PCard>

      <PSectionTitle title="Your Questions" />
      <div className="flex flex-col gap-3">
        {myDoubts.length === 0 && <PEmptyState emoji="💬" title="No questions yet" body="Ask your first doubt above!" />}
        {myDoubts.map((d) => (
          <PCard key={d.id}>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">{d.subject}</p>
            <p className="mt-1 font-semibold text-[var(--p-ink)]">{d.message}</p>
            <p className="mt-1 text-xs text-[var(--p-muted)]">{new Date(d.createdISO).toLocaleString()}</p>
            {d.reply ? (
              <div className="mt-3 rounded-xl bg-[var(--p-success-soft)] p-3 text-sm text-[#166534]">
                <strong>Teacher replied:</strong> {d.reply}
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-[var(--p-accent)]">Waiting for a reply…</p>
            )}
          </PCard>
        ))}
      </div>
    </div>
  );
}

export default function AskTeacherPage() {
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <AskTeacherView />
      </PlatformShell>
    </RoleGuard>
  );
}
