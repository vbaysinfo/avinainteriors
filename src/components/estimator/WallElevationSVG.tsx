"use client";

import { ComputedRow, Wall } from "@/lib/estimator/types";

interface WallElevationSVGProps {
  wall: Wall;
  rows: ComputedRow[];
}

const SCALE = 0.08; // px per mm
const GAP = 10;
const PAD = 30;

interface PositionedItem {
  row: ComputedRow;
  x: number;
  w: number;
  h: number;
}

function layoutItems(items: ComputedRow[]): PositionedItem[] {
  return items.reduce<PositionedItem[]>((acc, row) => {
    const w = (row.widthMm as number) * SCALE;
    const h = (row.heightMm as number) * SCALE;
    const previous = acc[acc.length - 1];
    const x = previous ? previous.x + previous.w + GAP : PAD;
    return [...acc, { row, x, w, h }];
  }, []);
}

export function WallElevationSVG({ rows }: WallElevationSVGProps) {
  const items = rows.filter((r) => r.widthMm && r.heightMm);

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-ink/15 text-xs text-ink/40">
        No components assigned to this wall yet.
      </div>
    );
  }

  const positioned = layoutItems(items);
  const maxHeight = Math.max(...positioned.map((p) => p.h));
  const last = positioned[positioned.length - 1];
  const svgWidth = last.x + last.w + PAD;
  const svgHeight = maxHeight + PAD * 2 + 30;

  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white/70 p-3">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <line
          x1={0}
          y1={svgHeight - PAD}
          x2={svgWidth}
          y2={svgHeight - PAD}
          stroke="#8d7b6b"
          strokeWidth={2}
        />
        {positioned.map(({ row, x, w, h }) => {
          const y = svgHeight - PAD - h;
          const dims = row.depthMm
            ? `${row.widthMm}×${row.heightMm}×${row.depthMm}mm`
            : `${row.widthMm}×${row.heightMm}mm`;
          return (
            <g key={row.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#ab8438"
                fillOpacity={0.15}
                stroke="#7c5c22"
                strokeWidth={1.5}
              />
              <text x={x + w / 2} y={y + h / 2} textAnchor="middle" fontSize={10} fill="#342619">
                {row.description.slice(0, 16)}
              </text>
              <text x={x + w / 2} y={svgHeight - PAD + 14} textAnchor="middle" fontSize={9} fill="#4d3f2f">
                {dims}
              </text>
              {row.qty > 1 && (
                <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#7c5c22">
                  x{row.qty}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
