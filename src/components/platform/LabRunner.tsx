"use client";

import { useSearchParams } from "next/navigation";
import { usePlatform } from "@/platform/store";
import type { StudentUser } from "@/platform/types";
import { getLab } from "@/platform/data/labs";
import { LabEngine } from "@/components/platform/lab-engine/LabEngine";
import { PBadgePill, PButton, PEmptyState, PSectionTitle } from "@/components/platform/ui";

export function LabRunner({ labId }: { labId: string }) {
  const params = useSearchParams();
  const assignmentId = params.get("assignmentId") ?? undefined;
  const { currentUser } = usePlatform();
  const student = currentUser as StudentUser;
  const lab = getLab(labId);

  if (!lab) {
    return <PEmptyState emoji="🔍" title="Lab not found" body="This lab may have been unpublished." />;
  }

  return (
    <div>
      <PSectionTitle
        title={`${lab.targetEmoji} ${lab.topic}`}
        subtitle={`${lab.subject} · ${lab.chapter}`}
        action={
          <div className="flex items-center gap-2">
            <PBadgePill tone="accent">⭐ {lab.xp} XP</PBadgePill>
            <PButton href="/platform/student/labs" variant="ghost" size="sm">
              ← All Labs
            </PButton>
          </div>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-[var(--p-ink-soft)]">{lab.description}</p>
      <LabEngine lab={lab} studentId={student.id} assignmentId={assignmentId} />
    </div>
  );
}
