"use client";

import { FileDown, Box } from "lucide-react";
import { downloadDxf } from "@/lib/estimator/dxfExport";
import { downloadPdfProposal } from "@/lib/estimator/pdfExport";
import { Project } from "@/lib/estimator/types";

export function ExportButtons({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => downloadPdfProposal(project)}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wider text-cream transition-colors hover:bg-gold-deep"
      >
        <FileDown size={14} /> Export BOM / Proposal PDF
      </button>
      <button
        onClick={() => downloadDxf(project)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink transition-colors hover:border-gold hover:text-gold-deep"
      >
        <Box size={14} /> Export 2D Layout (.dxf)
      </button>
    </div>
  );
}
