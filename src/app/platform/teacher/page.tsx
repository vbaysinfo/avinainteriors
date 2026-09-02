"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PSectionTitle, PStatCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { TeacherUser } from "@/platform/types";

function TeacherOverview() {
  const { state, currentUser } = usePlatform();
  const teacher = currentUser as TeacherUser;

  const myStudents = state.students.filter(
    (s) => s.schoolId === teacher.schoolId && teacher.classesHandled.includes(s.classNum)
  );
  const myAssignments = state.assignments.filter((a) => a.teacherId === teacher.id);
  const myAssignmentIds = new Set(myAssignments.map((a) => a.id));
  const mySubs = state.submissions.filter((s) => myAssignmentIds.has(s.assignmentId));
  const toReview = mySubs.filter((s) => s.status === "submitted").length;
  const graded = mySubs.filter((s) => s.status === "graded");
  const classAverage = graded.length
    ? Math.round(
        graded.reduce((sum, s) => {
          const a = state.assignments.find((x) => x.id === s.assignmentId);
          return sum + (a && s.score !== undefined ? (s.score / a.maxScore) * 100 : 0);
        }, 0) / graded.length
      )
    : 0;

  const recentSubs = [...mySubs]
    .filter((s) => s.submittedISO)
    .sort((a, b) => +new Date(b.submittedISO!) - +new Date(a.submittedISO!))
    .slice(0, 6);

  return (
    <div>
      <PSectionTitle title={`Welcome back, ${teacher.name.split(" ")[0]}! 👩‍🏫`} subtitle={teacher.subjects.join(", ") + " Teacher"} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PStatCard label="My Students" value={myStudents.length} emoji="🎒" tone="primary" />
        <PStatCard label="Pending Review" value={toReview} emoji="📝" tone="accent" />
        <PStatCard label="Class Average" value={`${classAverage}%`} emoji="📊" tone="secondary" />
        <PStatCard label="Assignments Live" value={myAssignments.length} emoji="📚" tone="pink" />
      </div>

      <PSectionTitle title="Recent Submissions" action={<PBadgePill tone="muted">Last 6</PBadgePill>} />
      <PCard>
        {recentSubs.length === 0 ? (
          <p className="text-sm text-[var(--p-muted)]">No submissions yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--p-border)]">
            {recentSubs.map((s) => {
              const student = state.students.find((st) => st.id === s.studentId);
              const assignment = state.assignments.find((a) => a.id === s.assignmentId);
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{student?.avatarEmoji}</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--p-ink)]">{student?.name}</p>
                      <p className="text-xs text-[var(--p-muted)]">{assignment?.title}</p>
                    </div>
                  </div>
                  <PBadgePill tone={s.status === "graded" ? "success" : "primary"}>
                    {s.status === "graded" ? `Graded · ${s.score}/${assignment?.maxScore}` : "Awaiting grading"}
                  </PBadgePill>
                </div>
              );
            })}
          </div>
        )}
      </PCard>
    </div>
  );
}

export default function TeacherOverviewPage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <PlatformShell>
        <TeacherOverview />
      </PlatformShell>
    </RoleGuard>
  );
}
