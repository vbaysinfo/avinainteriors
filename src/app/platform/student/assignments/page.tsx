"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { Assignment, QuizQuestion, StudentUser } from "@/platform/types";
import { Quiz } from "@/components/platform/lab-engine/Quiz";

const demoQuizzes: Record<string, QuizQuestion[]> = {
  "asg-3": [
    { id: "q1", question: "Which word is a NOUN?", options: ["Run", "Happy", "Table", "Quickly"], correctIndex: 2 },
    { id: "q2", question: "Which word is a VERB?", options: ["Jump", "Blue", "Slowly", "Dog"], correctIndex: 0 },
    { id: "q3", question: "Which word is an ADJECTIVE?", options: ["Sing", "Bright", "Car", "Under"], correctIndex: 1 },
  ],
};

function statusMeta(status: string) {
  if (status === "graded") return { label: "Graded", tone: "success" as const };
  if (status === "submitted") return { label: "Submitted", tone: "primary" as const };
  return { label: "Pending", tone: "warn" as const };
}

function AssignmentsView() {
  const { state, submitAssignment, currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const [openWritten, setOpenWritten] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const list: Assignment[] = state.assignments.filter(
    (a) => a.schoolId === student.schoolId && a.classNum === student.classNum && a.section === student.section
  );

  const subFor = (assignmentId: string) =>
    state.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === student.id);

  return (
    <div>
      <PSectionTitle title="Assignments" subtitle="Everything your teachers have assigned to your class." />
      <div className="flex flex-col gap-4">
        {list.length === 0 && <PEmptyState emoji="📝" title="No assignments yet" />}
        {list.map((a) => {
          const sub = subFor(a.id);
          const status = sub?.status ?? "pending";
          const meta = statusMeta(status);
          const overdue = status === "pending" && new Date(a.dueDateISO) < new Date();

          return (
            <PCard key={a.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-[var(--p-ink)]">{a.title}</p>
                    <PBadgePill tone="muted">{a.subject}</PBadgePill>
                    <PBadgePill tone="muted">{a.type}</PBadgePill>
                  </div>
                  <p className="mt-1 text-sm text-[var(--p-ink-soft)]">{a.instructions}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--p-muted)]">
                    Due {new Date(a.dueDateISO).toLocaleDateString()} {overdue && "· Overdue"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <PBadgePill tone={meta.tone}>{meta.label}</PBadgePill>
                  {status === "graded" && (
                    <p className="text-sm font-extrabold text-[var(--p-ink)]">
                      {sub?.score}/{a.maxScore}
                    </p>
                  )}
                </div>
              </div>

              {status !== "graded" && a.type === "lab" && a.labId && (
                <PButton href={`/platform/student/labs/${a.labId}?assignmentId=${a.id}`} className="self-start">
                  {status === "submitted" ? "Redo Lab" : "Start Lab"} →
                </PButton>
              )}

              {status === "pending" && a.type === "quiz" && demoQuizzes[a.id] && (
                <Quiz
                  questions={demoQuizzes[a.id]}
                  onSubmit={(correct, total) =>
                    submitAssignment(a.id, student.id, { auto: true, score: Math.round((correct / total) * a.maxScore) })
                  }
                />
              )}

              {status === "pending" && (a.type === "written" || a.type === "project") && (
                <div>
                  {openWritten === a.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={4}
                        placeholder="Type your answer, or paste a link/description of your work..."
                        className="p-input"
                      />
                      <div className="flex gap-2">
                        <PButton
                          size="sm"
                          onClick={() => {
                            submitAssignment(a.id, student.id, {});
                            setOpenWritten(null);
                            setDraft("");
                          }}
                        >
                          Submit for Grading
                        </PButton>
                        <PButton size="sm" variant="ghost" onClick={() => setOpenWritten(null)}>
                          Cancel
                        </PButton>
                      </div>
                    </div>
                  ) : (
                    <PButton size="sm" variant="secondary" onClick={() => setOpenWritten(a.id)} className="self-start">
                      Submit Work
                    </PButton>
                  )}
                </div>
              )}

              {status === "submitted" && (
                <p className="text-sm text-[var(--p-secondary)]">Waiting for your teacher to grade this ✋</p>
              )}
              {status === "graded" && sub?.feedback && (
                <p className="rounded-xl bg-[var(--p-bg-soft)] p-3 text-sm text-[var(--p-ink-soft)]">
                  <strong>Teacher feedback:</strong> {sub.feedback}
                </p>
              )}
            </PCard>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <AssignmentsView />
      </PlatformShell>
    </RoleGuard>
  );
}
