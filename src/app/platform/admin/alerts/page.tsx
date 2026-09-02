"use client";

import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { AdminUser } from "@/platform/types";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

const severityIcon = { info: Info, warning: AlertTriangle, critical: ShieldAlert };

function AlertsView() {
  const { state, currentUser } = usePlatform();
  const admin = currentUser as AdminUser;
  const alerts = [...state.alerts]
    .filter((a) => a.schoolId === admin.schoolId)
    .sort((a, b) => +new Date(b.createdISO) - +new Date(a.createdISO));

  return (
    <div>
      <PSectionTitle title="Alerts" subtitle="Auto-flagged issues across your school — inactivity, dropping scores, overdue work." />
      <div className="flex flex-col gap-3">
        {alerts.length === 0 && <PEmptyState emoji="🎉" title="All clear" body="No alerts right now." />}
        {alerts.map((a) => {
          const Icon = severityIcon[a.severity];
          return (
            <PCard key={a.id} className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  a.severity === "critical"
                    ? "bg-[var(--p-danger-soft)] text-[var(--p-danger)]"
                    : a.severity === "warning"
                      ? "bg-[var(--p-warn-soft)] text-[#946200]"
                      : "bg-[var(--p-primary-soft)] text-[var(--p-primary)]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[var(--p-ink)]">{a.title}</p>
                  <PBadgePill tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warn" : "primary"}>
                    {a.severity}
                  </PBadgePill>
                </div>
                <p className="mt-1 text-sm text-[var(--p-ink-soft)]">{a.detail}</p>
                <p className="mt-2 text-xs text-[var(--p-muted)]">{new Date(a.createdISO).toLocaleString()}</p>
              </div>
            </PCard>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAlertsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PlatformShell>
        <AlertsView />
      </PlatformShell>
    </RoleGuard>
  );
}
