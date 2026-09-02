"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PSectionTitle, PStatCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AdminUser } from "@/platform/types";
import { getSchool } from "@/platform/data/schools";

function AdminOverview() {
  const { state, currentUser } = usePlatform();
  const admin = currentUser as AdminUser;
  const school = getSchool(admin.schoolId);

  const students = state.students.filter((s) => s.schoolId === admin.schoolId);
  const teachers = state.teachers.filter((t) => t.schoolId === admin.schoolId);
  const assignments = state.assignments.filter((a) => a.schoolId === admin.schoolId);
  const classes = new Set(students.map((s) => `${s.classNum}${s.section}`));
  const alerts = state.alerts.filter((a) => a.schoolId === admin.schoolId);

  return (
    <div>
      <PSectionTitle
        title={`${school?.name ?? "School"} Overview`}
        subtitle={`${school?.city} · ${school?.board} · Principal ${admin.name}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PStatCard label="Students" value={students.length} emoji="🎒" tone="primary" />
        <PStatCard label="Teachers" value={teachers.length} emoji="👩‍🏫" tone="secondary" />
        <PStatCard label="Active Classes" value={classes.size} emoji="🏫" tone="accent" />
        <PStatCard label="Assignments" value={assignments.length} emoji="📚" tone="pink" />
      </div>

      <PSectionTitle title="Recent Alerts" action={<PButton href="/platform/admin/alerts" size="sm" variant="secondary">View All →</PButton>} />
      <div className="flex flex-col gap-3">
        {alerts.slice(0, 3).map((a) => (
          <PCard key={a.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[var(--p-ink)]">{a.title}</p>
              <p className="text-sm text-[var(--p-ink-soft)]">{a.detail}</p>
            </div>
            <PBadgePill tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warn" : "primary"}>
              {a.severity}
            </PBadgePill>
          </PCard>
        ))}
        {alerts.length === 0 && <PCard>No alerts right now. 🎉</PCard>}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PlatformShell>
        <AdminOverview />
      </PlatformShell>
    </RoleGuard>
  );
}
