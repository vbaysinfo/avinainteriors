"use client";

import { FileDown, Box, Download } from "lucide-react";
import { downloadDxf } from "@/lib/estimator/dxfExport";
import { downloadPdfProposal } from "@/lib/estimator/pdfExport";
import { downloadProjectJson } from "@/lib/estimator/projectIO";
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
        <Box size={14} /> Export DXF (2D Layout)
      </button>
      <button
        onClick={() => downloadProjectJson(project)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink transition-colors hover:border-gold hover:text-gold-deep"
        title="Back up this project as a file you can re-import on any browser or device"
      >
        <Download size={14} /> Backup Project (.json)
      </button>
    </div>
  );
}
