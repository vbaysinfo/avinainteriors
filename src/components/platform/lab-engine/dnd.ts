"use client";

import { useCallback, useRef } from "react";

/**
 * Minimal drop-zone registry shared by every drag interaction in the lab
 * engine. Zones register their DOM node under an id; on drag release we
 * test the pointer's client coordinates against each zone's live bounding
 * rect (recomputed on demand, so it stays correct across scroll/resize
 * without a continuous collision loop).
 */
export function useDropZones() {
  const zones = useRef<Map<string, HTMLElement>>(new Map());

  const registerZone = useCallback((id: string, el: HTMLElement | null) => {
    if (el) zones.current.set(id, el);
    else zones.current.delete(id);
  }, []);

  const getZoneAtPoint = useCallback((x: number, y: number): string | null => {
    for (const [id, el] of zones.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return id;
      }
    }
    return null;
  }, []);

  return { registerZone, getZoneAtPoint };
}

export function pointFromDragEvent(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
  if ("clientX" in event) return { x: event.clientX, y: event.clientY };
  const touch = (event as TouchEvent).changedTouches?.[0];
  return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
}
