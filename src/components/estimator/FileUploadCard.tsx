"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { parseExcelFile, ParsedExcel } from "@/lib/estimator/excelParser";

export function FileUploadCard({ onParsed }: { onParsed: (parsed: ParsedExcel) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      onParsed(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-ink/20 bg-white/50 p-8 text-center transition-colors hover:border-gold"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <UploadCloud className="mx-auto mb-2 text-gold-deep" size={28} />
      <p className="text-sm font-medium text-ink">
        {loading ? "Reading sheet…" : "Click or drop an Excel price sheet (.xlsx)"}
      </p>
      <p className="mt-1 text-xs text-ink/50">
        Columns expected: Room, Item Description, Width (ft), Height (ft), Depth (ft), Rate, Qty
      </p>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
