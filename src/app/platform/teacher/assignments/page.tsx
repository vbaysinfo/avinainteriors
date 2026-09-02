"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AssignmentType, SubjectName, TeacherUser } from "@/platform/types";
import { labs } from "@/platform/data/labs";

function CreateAssignmentForm({ teacher, onCreated }: { teacher: TeacherUser; onCreated: () => void }) {
  const { createAssignment } = usePlatform();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssignmentType>("quiz");
  const [subject, setSubject] = useState<SubjectName>(teacher.subjects[0]);
  const [classNum, setClassNum] = useState(teacher.classesHandled[0] ?? 6);
  const [section, setSection] = useState("A");
  const [labId, setLabId] = useState<string>("");
  const [maxScore, setMaxScore] = useState(20);
  const [dueInDays, setDueInDays] = useState(5);
  const [instructions, setInstructions] = useState("");

  const availableLabs = labs.filter((l) => l.subject === subject && l.status === "published");

  const submit = () => {
    if (!title.trim()) return;
    createAssignment({
      schoolId: teacher.schoolId,
      subject,
      classNum,
      section,
      title: title.trim(),
      type,
      labId: type === "lab" ? labId || availableLabs[0]?.id : undefined,
      teacherId: teacher.id,
      dueInDays,
      maxScore,
      instructions: instructions.trim() || "Complete this assignment before the due date.",
    });
    setTitle("");
    setInstructions("");
    onCreated();
  };

  return (
    <PCard>
      <p className="mb-4 font-extrabold text-[var(--p-ink)]">Create Assignment</p>
      <div className="flex flex-col gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" className="p-input" />
        <div className="grid grid-cols-2 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)} className="p-input">
            <option value="quiz">Quiz</option>
            <option value="lab">Lab</option>
            <option value="written">Written</option>
            <option value="project">Project</option>
          </select>
          <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectName)} className="p-input">
            {teacher.subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className="p-input">
            {teacher.classesHandled.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="p-input">
            {["A", "B"].map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
        {type === "lab" && (
          <select value={labId} onChange={(e) => setLabId(e.target.value)} className="p-input">
            <option value="">Choose a lab…</option>
            {availableLabs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.topic}
              </option>
            ))}
          </select>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase text-[var(--p-muted)]">Max Score</span>
            <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="p-input" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase text-[var(--p-muted)]">Due in (days)</span>
            <input type="number" value={dueInDays} onChange={(e) => setDueInDays(Number(e.target.value))} className="p-input" />
          </label>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for students"
          rows={2}
          className="p-input"
        />
        <PButton onClick={submit} disabled={!title.trim()}>
          Assign to Class {classNum}{section}
        </PButton>
      </div>
    </PCard>
  );
}

function AssignmentsView() {
  const { state, gradeSubmission, currentUser } = usePlatform();
  const teacher = currentUser as TeacherUser;
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

  const myAssignments = state.assignments
    .filter((a) => a.teacherId === teacher.id)
    .sort((a, b) => +new Date(b.createdISO) - +new Date(a.createdISO));

  return (
    <div>
      <PSectionTitle
        title="Assignments"
        subtitle="Create labs, quizzes and written work — then grade what comes in."
        action={<PButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "+ New Assignment"}</PButton>}
      />

      {showForm && (
        <div className="mb-6">
          <CreateAssignmentForm teacher={teacher} onCreated={() => setShowForm(false)} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {myAssignments.length === 0 && <PEmptyState emoji="📝" title="No assignments yet" body="Create your first one above." />}
        {myAssignments.map((a) => {
          const subs = state.submissions.filter((s) => s.assignmentId === a.id);
          const submittedCount = subs.filter((s) => s.status !== "pending").length;
          const gradedCount = subs.filter((s) => s.status === "graded").length;
          const isOpen = expanded === a.id;
          return (
            <PCard key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-[var(--p-ink)]">{a.title}</p>
                    <PBadgePill tone="muted">{a.type}</PBadgePill>
                    <PBadgePill tone="muted">
                      Class {a.classNum}
                      {a.section}
                    </PBadgePill>
                  </div>
                  <p className="mt-1 text-xs text-[var(--p-muted)]">
                    {submittedCount}/{subs.length} submitted · {gradedCount} graded · Due {new Date(a.dueDateISO).toLocaleDateString()}
                  </p>
                </div>
                <PButton size="sm" variant="secondary" onClick={() => setExpanded(isOpen ? null : a.id)}>
                  {isOpen ? "Hide" : "Review Submissions"}
                </PButton>
              </div>

              {isOpen && (
                <div className="mt-4 flex flex-col divide-y divide-[var(--p-border)] border-t border-[var(--p-border)]">
                  {subs.map((s) => {
                    const student = state.students.find((st) => st.id === s.studentId);
                    return (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{student?.avatarEmoji}</span>
                          <span className="text-sm font-bold text-[var(--p-ink)]">{student?.name}</span>
                        </div>
                        {s.status === "pending" && <PBadgePill tone="warn">Not submitted</PBadgePill>}
                        {s.status === "graded" && <PBadgePill tone="success">{s.score}/{a.maxScore}</PBadgePill>}
                        {s.status === "submitted" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              max={a.maxScore}
                              placeholder={`/${a.maxScore}`}
                              value={scoreDrafts[s.id] ?? ""}
                              onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                              className="p-input w-20 !py-1"
                            />
                            <PButton
                              size="sm"
                              onClick={() =>
                                gradeSubmission(s.id, Math.min(Number(scoreDrafts[s.id] ?? 0), a.maxScore), "Good work!")
                              }
                            >
                              Grade
                            </PButton>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </PCard>
          );
        })}
      </div>
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <PlatformShell>
        <AssignmentsView />
      </PlatformShell>
    </RoleGuard>
  );
}
