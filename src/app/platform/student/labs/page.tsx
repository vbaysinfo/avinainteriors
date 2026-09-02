import { Suspense } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LabsBrowser } from "@/components/platform/LabsBrowser";

export default function StudentLabsPage() {
  return (
    <RoleGuard allow={["student"]}>
      <PlatformShell>
        <Suspense fallback={null}>
          <LabsBrowser />
        </Suspense>
      </PlatformShell>
    </RoleGuard>
  );
}
