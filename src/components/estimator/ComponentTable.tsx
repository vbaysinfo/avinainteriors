"use client";

import { Trash2, Plus, Copy } from "lucide-react";
import { computeRow } from "@/lib/estimator/calc";
import { BOX_HEIGHT_PRESETS_FT, BOX_WIDTH_PRESETS_FT } from "@/lib/estimator/boxPresets";
import { DEFAULT_MATERIALS, getMaterialById } from "@/lib/estimator/materials";
import {
  ComponentKind,
  ComponentRow,
  COMPONENT_KIND_LABELS,
  ProjectType,
  Room,
  Wall,
  WALL_LABELS,
} from "@/lib/estimator/types";

interface ComponentTableProps {
  room: Room;
  projectType: ProjectType;
  onUpdateRow: (rowId: string, patch: Partial<ComponentRow>) => void;
  onRemoveRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onAddRow: () => void;
  onRemoveRoom: () => void;
  onRenameRoom: (name: string) => void;
}

const KIND_OPTIONS = Object.entries(COMPONENT_KIND_LABELS) as [ComponentKind, string][];
const WALL_OPTIONS = Object.entries(WALL_LABELS) as [Wall, string][];

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function ComponentTable({
  room,
  projectType,
  onUpdateRow,
  onRemoveRow,
  onDuplicateRow,
  onAddRow,
  onRemoveRoom,
  onRenameRoom,
}: ComponentTableProps) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          value={room.name}
          onChange={(e) => onRenameRoom(e.target.value)}
          className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink focus:border-gold focus:outline-none"
        />
        <button
          onClick={onRemoveRoom}
          className="text-xs text-ink/50 hover:text-red-600 transition-colors"
        >
          Remove room
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/60">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Description</th>
              <th className="py-2 pr-2 font-medium">Kind</th>
              <th className="py-2 pr-2 font-medium">Width (ft)</th>
              <th className="py-2 pr-2 font-medium">Height (ft)</th>
              <th className="py-2 pr-2 font-medium">Depth (ft)</th>
              <th className="py-2 pr-2 font-medium">Basis</th>
              <th className="py-2 pr-2 font-medium">Area/Vol</th>
              <th className="py-2 pr-2 font-medium">Material</th>
              <th className="py-2 pr-2 font-medium">Rate</th>
              <th className="py-2 pr-2 font-medium">Qty</th>
              <th className="py-2 pr-2 font-medium">Wall</th>
              <th className="py-2 pr-2 font-medium">Amount</th>
              <th className="py-2 pr-2 font-medium">Remarks</th>
              <th className="py-2 pr-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {room.components.map((row) => {
              const computed = computeRow(row);
              const fixedDims = projectType === "semi" && (row.kind === "box" || row.kind === "drawer");
              const heightPresets =
                row.kind === "drawer" ? BOX_HEIGHT_PRESETS_FT.drawer : BOX_HEIGHT_PRESETS_FT.box;

              return (
                <tr key={row.id} className="border-b border-ink/5 align-top">
                  <td className="py-1.5 pr-2 text-ink/50">{row.sno}</td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={row.description}
                      onChange={(e) => onUpdateRow(row.id, { description: e.target.value })}
                      placeholder="Item / furniture description"
                      className="w-40 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={row.kind}
                      onChange={(e) => onUpdateRow(row.id, { kind: e.target.value as ComponentKind })}
                      className="rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    >
                      {KIND_OPTIONS.map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    {fixedDims ? (
                      <select
                        value={row.widthFt ?? ""}
                        onChange={(e) => onUpdateRow(row.id, { widthFt: numOrNull(e.target.value) })}
                        className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                      >
                        <option value="">-</option>
                        {BOX_WIDTH_PRESETS_FT.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step="0.1"
                        value={row.widthFt ?? ""}
                        onChange={(e) => onUpdateRow(row.id, { widthFt: numOrNull(e.target.value) })}
                        className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                      />
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    {fixedDims ? (
                      <select
                        value={row.heightFt ?? ""}
                        onChange={(e) => onUpdateRow(row.id, { heightFt: numOrNull(e.target.value) })}
                        className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                      >
                        <option value="">-</option>
                        {heightPresets.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step="0.1"
                        value={row.heightFt ?? ""}
                        onChange={(e) => onUpdateRow(row.id, { heightFt: numOrNull(e.target.value) })}
                        className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                      />
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.1"
                      value={row.depthFt ?? ""}
                      placeholder="blank = frame"
                      onChange={(e) => onUpdateRow(row.id, { depthFt: numOrNull(e.target.value) })}
                      className="w-24 rounded border border-ink/15 bg-white px-2 py-1 placeholder:text-[10px] focus:border-gold focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-ink/60">
                    {computed.calcBasis === "area" ? "Sq.ft" : computed.calcBasis === "volume" ? "Cu.ft" : "-"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink/60">{computed.areaOrVolume ?? "-"}</td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={row.materialId}
                      onChange={(e) => {
                        const m = getMaterialById(e.target.value);
                        onUpdateRow(row.id, {
                          materialId: m.id,
                          rate: computed.calcBasis === "volume" ? m.ratePerCuft : m.ratePerSqft,
                        });
                      }}
                      className="w-36 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    >
                      {DEFAULT_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) => onUpdateRow(row.id, { rate: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    />
                    <div className="mt-0.5 text-[10px] text-ink/40">
                      /{computed.calcBasis === "volume" ? "Cu.ft" : "Sq.ft"}
                    </div>
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => onUpdateRow(row.id, { qty: parseFloat(e.target.value) || 1 })}
                      className="w-14 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={row.wall}
                      onChange={(e) => onUpdateRow(row.id, { wall: e.target.value as Wall })}
                      className="rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
                    >
                      {WALL_OPTIONS.map(([w, label]) => (
                        <option key={w} value={w}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2 font-medium text-ink">
                    ₹{computed.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={row.remarks}
                      onChange={(e) => onUpdateRow(row.id, { remarks: e.target.value })}
                      placeholder="Optional note"
                      className="w-32 rounded border border-ink/15 bg-white px-2 py-1 placeholder:text-[10px] focus:border-gold focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDuplicateRow(row.id)}
                        className="text-ink/40 hover:text-gold-deep transition-colors"
                        aria-label="Duplicate row"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveRow(row.id)}
                        className="text-ink/40 hover:text-red-600 transition-colors"
                        aria-label="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={onAddRow}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-3 py-1.5 text-xs text-ink/70 hover:border-gold hover:text-gold-deep transition-colors"
      >
        <Plus size={14} /> Add component
      </button>
    </div>
  );
}
