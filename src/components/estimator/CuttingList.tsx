"use client";

import { useMemo } from "react";
import { generateCutPanels } from "@/lib/estimator/calc";
import { Project, Wall, WALL_LABELS } from "@/lib/estimator/types";

const WALLS: Wall[] = ["front", "left", "right", "back", "unassigned"];

export function CuttingList({ project }: { project: Project }) {
  const panels = useMemo(() => generateCutPanels(project.rooms), [project.rooms]);

  return (
    <div className="space-y-6">
      {project.rooms.map((room) => {
        const roomPanels = panels.filter((p) => p.room === room.name);
        if (roomPanels.length === 0) return null;

        return (
          <div key={room.id} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
            <h3 className="mb-3 font-display text-lg text-ink">{room.name}</h3>
            {WALLS.map((wall) => {
              const wallPanels = roomPanels.filter((p) => p.wall === wall);
              if (wallPanels.length === 0) return null;
              return (
                <div key={wall} className="mb-4">
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gold-deep">
                    {WALL_LABELS[wall]}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-ink/10 text-left text-ink/50">
                        <th className="py-1 pr-2 font-medium">Component</th>
                        <th className="py-1 pr-2 font-medium">Panel</th>
                        <th className="py-1 pr-2 font-medium text-right">W (mm)</th>
                        <th className="py-1 pr-2 font-medium text-right">H (mm)</th>
                        <th className="py-1 pr-2 font-medium text-right">Thk (mm)</th>
                        <th className="py-1 pr-2 font-medium">Material</th>
                        <th className="py-1 pr-2 font-medium text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallPanels.map((p) => (
                        <tr key={p.id} className="border-b border-ink/5">
                          <td className="py-1 pr-2 text-ink/70">{p.componentDescription}</td>
                          <td className="py-1 pr-2 text-ink">{p.panelName}</td>
                          <td className="py-1 pr-2 text-right">{p.widthMm}</td>
                          <td className="py-1 pr-2 text-right">{p.heightMm}</td>
                          <td className="py-1 pr-2 text-right">{p.thicknessMm}</td>
                          <td className="py-1 pr-2 text-ink/60">{p.materialName}</td>
                          <td className="py-1 pr-2 text-right">{p.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
      {panels.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/40">
          Add components with a width and height to generate the cutting list.
        </div>
      )}
    </div>
  );
}
