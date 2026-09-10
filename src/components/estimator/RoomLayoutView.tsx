"use client";

import { useState } from "react";
import { computeRow } from "@/lib/estimator/calc";
import { Room, Wall, WALL_LABELS } from "@/lib/estimator/types";
import { WallElevationSVG } from "./WallElevationSVG";

const WALLS: Wall[] = ["front", "left", "right", "back"];

export function RoomLayoutView({ room }: { room: Room }) {
  const [activeWall, setActiveWall] = useState<Wall>("front");
  const computed = room.components.map(computeRow);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
      <h3 className="mb-3 font-display text-lg text-ink">{room.name}</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {WALLS.map((wall) => {
          const count = computed.filter((r) => r.wall === wall).length;
          return (
            <button
              key={wall}
              onClick={() => setActiveWall(wall)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                activeWall === wall
                  ? "border-gold bg-gold/15 text-gold-deep"
                  : "border-ink/15 text-ink/60 hover:border-ink/30"
              }`}
            >
              {WALL_LABELS[wall]} ({count})
            </button>
          );
        })}
      </div>
      <WallElevationSVG wall={activeWall} rows={computed.filter((r) => r.wall === activeWall)} />
    </div>
  );
}
