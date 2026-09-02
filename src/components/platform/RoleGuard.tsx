"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/platform/types";
import { usePlatform } from "@/platform/store";

export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { state, ready } = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return; // wait for localStorage hydration before deciding
    if (!state.session || !allow.includes(state.session.role)) {
      router.replace("/platform/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.session]);

  if (!ready || !state.session || !allow.includes(state.session.role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="p-animate-pop text-center text-[var(--p-muted)]">
          <div className="text-4xl">🔒</div>
          <p className="mt-2 text-sm">Checking your login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
