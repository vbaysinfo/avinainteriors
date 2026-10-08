"use client";

import { usePathname } from "next/navigation";

/** Internal tools (e.g. /sketch-to-excel) render without the marketing site's chrome. */
const TOOL_PREFIXES = ["/sketch-to-excel"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (TOOL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
