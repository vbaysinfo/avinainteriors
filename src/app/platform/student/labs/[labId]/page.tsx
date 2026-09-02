import { Suspense } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LabRunner } from "@/components/platform/LabRunner";

export default async function LabRunnerPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const { labId } = await params;
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <Suspense fallback={null}>
          <LabRunner labId={labId} />
        </Suspense>
      </PlatformShell>
    </RoleGuard>
  );
}
