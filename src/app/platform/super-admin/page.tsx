"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PSectionTitle, PStatCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";

function SuperAdminOverview() {
  const { state } = usePlatform();
  const totalStudents = state.students.length;
  const totalTeachers = state.teachers.length;
  const activeSchools = state.schools.filter((s) => s.status === "active").length;
  const trialSchools = state.schools.filter((s) => s.status === "trial").length;

  return (
    <div>
      <PSectionTitle title="Platform Overview" subtitle="Every school running on D.Interactive." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PStatCard label="Schools" value={state.schools.length} emoji="🏫" tone="primary" />
        <PStatCard label="Active" value={activeSchools} emoji="✅" tone="secondary" sub={`${trialSchools} on trial`} />
        <PStatCard label="Total Students" value={totalStudents} emoji="🎒" tone="accent" />
        <PStatCard label="Total Teachers" value={totalTeachers} emoji="👩‍🏫" tone="pink" />
      </div>

      <PSectionTitle title="Schools at a Glance" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.schools.map((school) => (
          <PCard key={school.id}>
            <div
              className="flex h-16 items-center gap-3 rounded-2xl px-4 text-white"
              style={{ background: `linear-gradient(135deg, ${school.colorFrom}, ${school.colorTo})` }}
            >
              <span className="text-2xl">{school.logoEmoji}</span>
              <div>
                <p className="font-extrabold">{school.name}</p>
                <p className="text-xs opacity-85">{school.city}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[var(--p-ink-soft)]">
                {state.students.filter((s) => s.schoolId === school.id).length} students ·{" "}
                {state.teachers.filter((t) => t.schoolId === school.id).length} teachers
              </span>
              <PBadgePill tone={school.status === "active" ? "success" : school.status === "trial" ? "warn" : "danger"}>
                {school.status}
              </PBadgePill>
            </div>
          </PCard>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminOverviewPage() {
  return (
    <RoleGuard allow={["super-admin"]}>
      <PlatformShell>
        <SuperAdminOverview />
      </PlatformShell>
    </RoleGuard>
  );
}
