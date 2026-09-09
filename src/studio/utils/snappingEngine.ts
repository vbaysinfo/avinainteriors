import { FurnitureItem, Wall, Room } from '../types/cad';

export interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  type?: 'wall' | 'item_edge' | 'item_center' | 'flush' | 'room_center' | 'equal_gap';
  targetItemId?: string;
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guideLines: GuideLine[];
  snapBadge?: {
    x: number;
    y: number;
    text: string;
  };
  alignedItemIds: string[];
}

export function calculateIntelligentSnapping(
  item: FurnitureItem,
  targetX: number,
  targetY: number,
  room: Room,
  gridSize: number = 25,
  snapThreshold: number = 50
): SnapResult {
  let snappedX = targetX;
  let snappedY = targetY;

  // 1. Base Grid Snap (25mm fine modular step)
  snappedX = Math.round(targetX / gridSize) * gridSize;
  snappedY = Math.round(targetY / gridSize) * gridSize;

  const itemW = item.width;
  const itemD = item.depth;
  const itemRight = snappedX + itemW;
  const itemBottom = snappedY + itemD;
  const itemCenterX = snappedX + itemW / 2;
  const itemCenterY = snappedY + itemD / 2;

  const guideLines: GuideLine[] = [];
  const alignedItemIds: string[] = [];
  let snapBadge: SnapResult['snapBadge'] | undefined;

  // 2. WALL ALIGNMENT & ATTACHMENT GUIDES
  // Left wall (X = 0)
  if (Math.abs(snappedX - 0) < snapThreshold) {
    snappedX = 0;
    guideLines.push({
      x1: 0,
      y1: -100,
      x2: 0,
      y2: room.depthMm + 100,
      color: '#38BDF8',
      label: 'Aligned Left Wall: 0 mm',
      type: 'wall',
    });
    snapBadge = { x: 20, y: snappedY + itemD / 2, text: 'Left Wall: 0 mm' };
  } else if (Math.abs(snappedX - 50) < 15) {
    snappedX = 50;
    guideLines.push({
      x1: 50,
      y1: -50,
      x2: 50,
      y2: room.depthMm + 50,
      color: '#38BDF8',
      label: 'Filler Gap: 50 mm',
      type: 'wall',
    });
    snapBadge = { x: 60, y: snappedY + itemD / 2, text: 'Filler Gap: 50 mm' };
  }

  // Right wall (X = room.widthMm)
  if (Math.abs(itemRight - room.widthMm) < snapThreshold) {
    snappedX = room.widthMm - itemW;
    guideLines.push({
      x1: room.widthMm,
      y1: -100,
      x2: room.widthMm,
      y2: room.depthMm + 100,
      color: '#38BDF8',
      label: 'Aligned Right Wall: 0 mm',
      type: 'wall',
    });
    snapBadge = { x: room.widthMm - itemW - 40, y: snappedY + itemD / 2, text: 'Right Wall: 0 mm' };
  }

  // Top wall (Y = 0)
  if (Math.abs(snappedY - 0) < snapThreshold) {
    snappedY = 0;
    guideLines.push({
      x1: -100,
      y1: 0,
      x2: room.widthMm + 100,
      y2: 0,
      color: '#38BDF8',
      label: 'Aligned Top Wall: 0 mm',
      type: 'wall',
    });
    snapBadge = { x: snappedX + itemW / 2, y: 20, text: 'Top Wall: 0 mm' };
  }

  // Bottom wall (Y = room.depthMm)
  if (Math.abs(itemBottom - room.depthMm) < snapThreshold) {
    snappedY = room.depthMm - itemD;
    guideLines.push({
      x1: -100,
      y1: room.depthMm,
      x2: room.widthMm + 100,
      y2: room.depthMm,
      color: '#38BDF8',
      label: 'Aligned Bottom Wall: 0 mm',
      type: 'wall',
    });
    snapBadge = { x: snappedX + itemW / 2, y: room.depthMm - 20, text: 'Bottom Wall: 0 mm' };
  }

  // Room Center Alignment (X or Y)
  const roomMidX = Math.round(room.widthMm / 2);
  const roomMidY = Math.round(room.depthMm / 2);
  if (Math.abs(itemCenterX - roomMidX) < snapThreshold / 2) {
    snappedX = roomMidX - itemW / 2;
    guideLines.push({
      x1: roomMidX,
      y1: -150,
      x2: roomMidX,
      y2: room.depthMm + 150,
      color: '#A855F7',
      label: 'Room Centerline X',
      type: 'room_center',
    });
  }
  if (Math.abs(itemCenterY - roomMidY) < snapThreshold / 2) {
    snappedY = roomMidY - itemD / 2;
    guideLines.push({
      x1: -150,
      y1: roomMidY,
      x2: room.widthMm + 150,
      y2: roomMidY,
      color: '#A855F7',
      label: 'Room Centerline Y',
      type: 'room_center',
    });
  }

  // 3. DYNAMIC ADJACENT FURNITURE ALIGNMENTS
  room.furniture.forEach((other) => {
    if (other.id === item.id) return;

    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.depth;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.depth / 2;

    let matched = false;

    // --- HORIZONTAL SNAP & ALIGNMENT ---
    // A. Flush Right-to-Left (other's right meets item's left)
    if (Math.abs(snappedX - otherRight) < snapThreshold) {
      snappedX = otherRight;
      guideLines.push({
        x1: otherRight,
        y1: Math.min(snappedY, other.y) - 80,
        x2: otherRight,
        y2: Math.max(snappedY + itemD, otherBottom) + 80,
        color: '#E879F9',
        label: 'Flush: 0 mm',
        type: 'flush',
        targetItemId: other.id,
      });
      snapBadge = { x: otherRight, y: snappedY + itemD / 2, text: 'Joined: 0 mm' };
      matched = true;
    }
    // B. Flush Left-to-Right (item's right meets other's left)
    else if (Math.abs((snappedX + itemW) - other.x) < snapThreshold) {
      snappedX = other.x - itemW;
      guideLines.push({
        x1: other.x,
        y1: Math.min(snappedY, other.y) - 80,
        x2: other.x,
        y2: Math.max(snappedY + itemD, otherBottom) + 80,
        color: '#E879F9',
        label: 'Flush: 0 mm',
        type: 'flush',
        targetItemId: other.id,
      });
      snapBadge = { x: other.x, y: snappedY + itemD / 2, text: 'Joined: 0 mm' };
      matched = true;
    }
    // C. Left Edges Aligned (X == other.x)
    else if (Math.abs(snappedX - other.x) < snapThreshold) {
      snappedX = other.x;
      guideLines.push({
        x1: other.x,
        y1: Math.min(snappedY, other.y) - 100,
        x2: other.x,
        y2: Math.max(snappedY + itemD, otherBottom) + 100,
        color: '#34D399',
        label: 'Left Edge Aligned',
        type: 'item_edge',
        targetItemId: other.id,
      });
      matched = true;
    }
    // D. Right Edges Aligned (X + W == other.x + other.width)
    else if (Math.abs((snappedX + itemW) - otherRight) < snapThreshold) {
      snappedX = otherRight - itemW;
      guideLines.push({
        x1: otherRight,
        y1: Math.min(snappedY, other.y) - 100,
        x2: otherRight,
        y2: Math.max(snappedY + itemD, otherBottom) + 100,
        color: '#34D399',
        label: 'Right Edge Aligned',
        type: 'item_edge',
        targetItemId: other.id,
      });
      matched = true;
    }
    // E. Center-X Aligned
    else if (Math.abs((snappedX + itemW / 2) - otherCenterX) < snapThreshold / 1.5) {
      snappedX = otherCenterX - itemW / 2;
      guideLines.push({
        x1: otherCenterX,
        y1: Math.min(snappedY, other.y) - 120,
        x2: otherCenterX,
        y2: Math.max(snappedY + itemD, otherBottom) + 120,
        color: '#FBBF24',
        label: 'Center-X Aligned',
        type: 'item_center',
        targetItemId: other.id,
      });
      matched = true;
    }

    // --- VERTICAL SNAP & ALIGNMENT ---
    // F. Flush Top-to-Bottom (other's bottom meets item's top)
    if (Math.abs(snappedY - otherBottom) < snapThreshold) {
      snappedY = otherBottom;
      guideLines.push({
        x1: Math.min(snappedX, other.x) - 80,
        y1: otherBottom,
        x2: Math.max(snappedX + itemW, otherRight) + 80,
        y2: otherBottom,
        color: '#E879F9',
        label: 'Flush: 0 mm',
        type: 'flush',
        targetItemId: other.id,
      });
      matched = true;
    }
    // G. Flush Bottom-to-Top (item's bottom meets other's top)
    else if (Math.abs((snappedY + itemD) - other.y) < snapThreshold) {
      snappedY = other.y - itemD;
      guideLines.push({
        x1: Math.min(snappedX, other.x) - 80,
        y1: other.y,
        x2: Math.max(snappedX + itemW, otherRight) + 80,
        y2: other.y,
        color: '#E879F9',
        label: 'Flush: 0 mm',
        type: 'flush',
        targetItemId: other.id,
      });
      matched = true;
    }
    // H. Top Edges Aligned (Y == other.y)
    else if (Math.abs(snappedY - other.y) < snapThreshold) {
      snappedY = other.y;
      guideLines.push({
        x1: Math.min(snappedX, other.x) - 100,
        y1: other.y,
        x2: Math.max(snappedX + itemW, otherRight) + 100,
        y2: other.y,
        color: '#34D399',
        label: 'Top Edge Aligned',
        type: 'item_edge',
        targetItemId: other.id,
      });
      matched = true;
    }
    // I. Bottom Edges Aligned (Y + D == other.y + other.depth)
    else if (Math.abs((snappedY + itemD) - otherBottom) < snapThreshold) {
      snappedY = otherBottom - itemD;
      guideLines.push({
        x1: Math.min(snappedX, other.x) - 100,
        y1: otherBottom,
        x2: Math.max(snappedX + itemW, otherRight) + 100,
        y2: otherBottom,
        color: '#34D399',
        label: 'Bottom Edge Aligned',
        type: 'item_edge',
        targetItemId: other.id,
      });
      matched = true;
    }
    // J. Center-Y Aligned
    else if (Math.abs((snappedY + itemD / 2) - otherCenterY) < snapThreshold / 1.5) {
      snappedY = otherCenterY - itemD / 2;
      guideLines.push({
        x1: Math.min(snappedX, other.x) - 120,
        y1: otherCenterY,
        x2: Math.max(snappedX + itemW, otherRight) + 120,
        y2: otherCenterY,
        color: '#FBBF24',
        label: 'Center-Y Aligned',
        type: 'item_center',
        targetItemId: other.id,
      });
      matched = true;
    }

    if (matched) {
      alignedItemIds.push(other.id);
    }
  });

  return {
    snappedX,
    snappedY,
    guideLines,
    snapBadge,
    alignedItemIds,
  };
}

