"use client";

import { Plus, Trash2 } from "lucide-react";
import { Material } from "@/lib/estimator/types";

interface MaterialsPanelProps {
  materials: Material[];
  onAdd: () => void;
  onUpdate: (materialId: string, patch: Partial<Material>) => void;
  onRemove: (materialId: string) => void;
}

function numOrZero(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function MaterialsPanel({ materials, onAdd, onUpdate, onRemove }: MaterialsPanelProps) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg text-ink">Material Catalogue & Specifications</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-3 py-1.5 text-xs text-ink/70 hover:border-gold hover:text-gold-deep transition-colors"
        >
          <Plus size={14} /> Add material
        </button>
      </div>
      <p className="mb-4 text-xs text-ink/50">
        Rates and specs here drive every row in the input sheet, the pricing report, and the
        Material Specifications section of the exported BOM/proposal PDF.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/60">
              <th className="py-2 pr-2 font-medium">Material Name</th>
              <th className="py-2 pr-2 font-medium">Specification</th>
              <th className="py-2 pr-2 font-medium">Rate / Sq.ft</th>
              <th className="py-2 pr-2 font-medium">Rate / Cu.ft</th>
              <th className="py-2 pr-2 font-medium">Thickness (mm)</th>
              <th className="py-2 pr-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-ink/5 align-top">
                <td className="py-1.5 pr-2">
                  <input
                    value={m.name}
                    onChange={(e) => onUpdate(m.id, { name: e.target.value })}
                    className="w-44 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    value={m.spec}
                    onChange={(e) => onUpdate(m.id, { spec: e.target.value })}
                    placeholder="Grade, brand, finish, ISI mark…"
                    className="w-72 rounded border border-ink/15 bg-white px-2 py-1 placeholder:text-[10px] focus:border-gold focus:outline-none"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    value={m.ratePerSqft}
                    onChange={(e) => onUpdate(m.id, { ratePerSqft: numOrZero(e.target.value) })}
                    className="w-24 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    value={m.ratePerCuft}
                    onChange={(e) => onUpdate(m.id, { ratePerCuft: numOrZero(e.target.value) })}
                    className="w-24 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    value={m.thicknessMm}
                    onChange={(e) => onUpdate(m.id, { thicknessMm: numOrZero(e.target.value) })}
                    className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <button
                    onClick={() => onRemove(m.id)}
                    disabled={materials.length <= 1}
                    className="text-ink/40 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove material"
                    title={materials.length <= 1 ? "At least one material is required" : "Remove material"}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
