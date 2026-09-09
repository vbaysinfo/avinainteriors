"use client";

import dynamic from "next/dynamic";

const StudioApp = dynamic(() => import("@/studio/App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Loading Design Studio…
        </span>
      </div>
    </div>
  ),
});

export default function StudioClient() {
  return <StudioApp />;
}
