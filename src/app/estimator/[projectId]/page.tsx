"use client";

import { useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EstimatorWorkspace } from "@/components/estimator/EstimatorWorkspace";
import { getProject, subscribeProjects } from "@/lib/estimator/storage";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const project = useSyncExternalStore(
    subscribeProjects,
    () => getProject(params.projectId),
    () => null
  );

  if (project === null) {
    return (
      <div className="container-px mx-auto max-w-6xl py-14">
        <p className="text-sm text-ink/60">
          This project was not found in this browser&apos;s storage.
        </p>
        <button
          onClick={() => router.push("/estimator")}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline"
        >
          <ArrowLeft size={14} /> Back to Estimator
        </button>
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-6xl py-10">
      <button
        onClick={() => router.push("/estimator")}
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-gold-deep"
      >
        <ArrowLeft size={14} /> All projects
      </button>
      <EstimatorWorkspace initialProject={project} />
    </div>
  );
}
