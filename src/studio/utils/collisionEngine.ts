import { Room, FurnitureItem, Column, Door } from '../types/cad';

export interface FurnitureOverlapArea {
  x: number;
  y: number;
  width: number;
  depth: number;
  otherItemId: string;
  otherItemName: string;
  type: 'furniture' | 'column' | 'door';
}

export interface FurnitureBoundaryViolation {
  side: 'left' | 'right' | 'top' | 'bottom';
  overlapMm: number;
  exceededRect: {
    x: number;
    y: number;
    width: number;
    depth: number;
  };
}

export interface FurnitureCollisionInfo {
  itemId: string;
  hasCollision: boolean;
  isOutOfBounds: boolean;
  isFurnitureOverlap: boolean;
  isColumnClash: boolean;
  isDoorClash: boolean;
  collidingWithIds: string[];
  overlapAreas: FurnitureOverlapArea[];
  boundaryViolations: FurnitureBoundaryViolation[];
  primaryReason?: string;
  messages: string[];
}

export interface RoomCollisionReport {
  totalCollisions: number;
  collidingItemCount: number;
  outOfBoundsCount: number;
  furnitureOverlapCount: number;
  columnClashCount: number;
  collisionMap: Map<string, FurnitureCollisionInfo>;
  itemsWithIssues: FurnitureCollisionInfo[];
}

/**
 * Checks if two 3D bounding boxes intersect in space (X, Y, and Z elevation).
 */
export function check3dBoundingIntersection(
  itemA: FurnitureItem,
  itemB: FurnitureItem,
  tolerance = 1
): { intersects: boolean; overlapRect?: { x: number; y: number; width: number; depth: number } } {
  const ax1 = itemA.x;
  const ax2 = itemA.x + itemA.width;
  const ay1 = itemA.y;
  const ay2 = itemA.y + itemA.depth;
  const az1 = itemA.z || 0;
  const az2 = az1 + (itemA.height || 720);

  const bx1 = itemB.x;
  const bx2 = itemB.x + itemB.width;
  const by1 = itemB.y;
  const by2 = itemB.y + itemB.depth;
  const bz1 = itemB.z || 0;
  const bz2 = bz1 + (itemB.height || 720);

  // Check 2D overlap in X
  const ix1 = Math.max(ax1, bx1);
  const ix2 = Math.min(ax2, bx2);
  const ow = ix2 - ix1;

  // Check 2D overlap in Y
  const iy1 = Math.max(ay1, by1);
  const iy2 = Math.min(ay2, by2);
  const od = iy2 - iy1;

  if (ow <= tolerance || od <= tolerance) {
    return { intersects: false };
  }

  // Check 1D vertical elevation overlap in Z
  const iz1 = Math.max(az1, bz1);
  const iz2 = Math.min(az2, bz2);
  const oz = iz2 - iz1;

  // If items do not overlap vertically (e.g. wall unit @ 1400mm over base cabinet @ 0-720mm), they don't collide
  if (oz <= tolerance) {
    return { intersects: false };
  }

  return {
    intersects: true,
    overlapRect: {
      x: ix1,
      y: iy1,
      width: ow,
      depth: od,
    },
  };
}

/**
 * Checks if a furniture item exceeds the boundaries of the room.
 */
export function checkBoundaryViolations(
  item: FurnitureItem,
  roomWidthMm: number,
  roomDepthMm: number
): FurnitureBoundaryViolation[] {
  const violations: FurnitureBoundaryViolation[] = [];
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const d = item.depth;

  // Left boundary (x < 0)
  if (x < 0) {
    violations.push({
      side: 'left',
      overlapMm: Math.abs(x),
      exceededRect: {
        x: x,
        y: y,
        width: Math.abs(x),
        depth: d,
      },
    });
  }

  // Right boundary (x + w > roomWidthMm)
  if (x + w > roomWidthMm) {
    const overflow = x + w - roomWidthMm;
    violations.push({
      side: 'right',
      overlapMm: overflow,
      exceededRect: {
        x: roomWidthMm,
        y: y,
        width: overflow,
        depth: d,
      },
    });
  }

  // Top boundary (y < 0)
  if (y < 0) {
    violations.push({
      side: 'top',
      overlapMm: Math.abs(y),
      exceededRect: {
        x: x,
        y: y,
        width: w,
        depth: Math.abs(y),
      },
    });
  }

  // Bottom boundary (y + d > roomDepthMm)
  if (y + d > roomDepthMm) {
    const overflow = y + d - roomDepthMm;
    violations.push({
      side: 'bottom',
      overlapMm: overflow,
      exceededRect: {
        x: x,
        y: roomDepthMm,
        width: w,
        depth: overflow,
      },
    });
  }

  return violations;
}

/**
 * Checks if a furniture item clashes with structural columns.
 */
export function checkColumnClashes(item: FurnitureItem, columns: Column[]): FurnitureOverlapArea[] {
  const clashes: FurnitureOverlapArea[] = [];
  const ix1 = item.x;
  const ix2 = item.x + item.width;
  const iy1 = item.y;
  const iy2 = item.y + item.depth;

  for (const col of columns) {
    const cx1 = col.x;
    const cx2 = col.x + col.width;
    const cy1 = col.y;
    const cy2 = col.y + col.depth;

    const ox1 = Math.max(ix1, cx1);
    const ox2 = Math.min(ix2, cx2);
    const ow = ox2 - ox1;

    const oy1 = Math.max(iy1, cy1);
    const oy2 = Math.min(iy2, cy2);
    const od = oy2 - oy1;

    if (ow > 1 && od > 1) {
      clashes.push({
        x: ox1,
        y: oy1,
        width: ow,
        depth: od,
        otherItemId: col.id,
        otherItemName: `Structural Column (${col.width}×${col.depth}mm)`,
        type: 'column',
      });
    }
  }

  return clashes;
}

/**
 * Runs full comprehensive collision detection across all furniture items in a room.
 */
export function detectRoomCollisions(
  room: Room,
  overrideFurnitureList?: FurnitureItem[]
): RoomCollisionReport {
  const furnitureList = overrideFurnitureList || room.furniture;
  const collisionMap = new Map<string, FurnitureCollisionInfo>();

  // Initialize report entries
  furnitureList.forEach((item) => {
    collisionMap.set(item.id, {
      itemId: item.id,
      hasCollision: false,
      isOutOfBounds: false,
      isFurnitureOverlap: false,
      isColumnClash: false,
      isDoorClash: false,
      collidingWithIds: [],
      overlapAreas: [],
      boundaryViolations: [],
      messages: [],
    });
  });

  let outOfBoundsCount = 0;
  let furnitureOverlapCount = 0;
  let columnClashCount = 0;

  // 1. Check Boundary Violations
  furnitureList.forEach((item) => {
    const info = collisionMap.get(item.id)!;
    const violations = checkBoundaryViolations(item, room.widthMm, room.depthMm);

    if (violations.length > 0) {
      info.isOutOfBounds = true;
      info.hasCollision = true;
      info.boundaryViolations = violations;
      outOfBoundsCount++;

      const sideLabels = violations.map((v) => `${v.side} by ${Math.round(v.overlapMm)}mm`).join(', ');
      info.messages.push(`Placed outside room boundaries (${sideLabels})`);
      if (!info.primaryReason) {
        info.primaryReason = `Exceeds room boundary (${sideLabels})`;
      }
    }
  });

  // 2. Check Furniture-to-Furniture Collisions
  for (let i = 0; i < furnitureList.length; i++) {
    for (let j = i + 1; j < furnitureList.length; j++) {
      const itemA = furnitureList[i];
      const itemB = furnitureList[j];

      const res = check3dBoundingIntersection(itemA, itemB);
      if (res.intersects && res.overlapRect) {
        const infoA = collisionMap.get(itemA.id)!;
        const infoB = collisionMap.get(itemB.id)!;

        infoA.hasCollision = true;
        infoA.isFurnitureOverlap = true;
        infoA.collidingWithIds.push(itemB.id);
        infoA.overlapAreas.push({
          ...res.overlapRect,
          otherItemId: itemB.id,
          otherItemName: itemB.name.split(' (')[0],
          type: 'furniture',
        });

        const overlapText = `${Math.round(res.overlapRect.width)}×${Math.round(res.overlapRect.depth)}mm`;
        infoA.messages.push(`Overlaps with "${itemB.name.split(' (')[0]}" (${overlapText})`);
        if (!infoA.primaryReason) {
          infoA.primaryReason = `Overlaps ${itemB.name.split(' (')[0]} (${overlapText})`;
        }

        infoB.hasCollision = true;
        infoB.isFurnitureOverlap = true;
        infoB.collidingWithIds.push(itemA.id);
        infoB.overlapAreas.push({
          ...res.overlapRect,
          otherItemId: itemA.id,
          otherItemName: itemA.name.split(' (')[0],
          type: 'furniture',
        });
        infoB.messages.push(`Overlaps with "${itemA.name.split(' (')[0]}" (${overlapText})`);
        if (!infoB.primaryReason) {
          infoB.primaryReason = `Overlaps ${itemA.name.split(' (')[0]} (${overlapText})`;
        }

        furnitureOverlapCount++;
      }
    }
  }

  // 3. Check Column Clashes
  if (room.columns && room.columns.length > 0) {
    furnitureList.forEach((item) => {
      const info = collisionMap.get(item.id)!;
      const columnClashes = checkColumnClashes(item, room.columns);

      if (columnClashes.length > 0) {
        info.hasCollision = true;
        info.isColumnClash = true;
        info.overlapAreas.push(...columnClashes);
        columnClashCount += columnClashes.length;

        columnClashes.forEach((c) => {
          info.messages.push(`Clashes with ${c.otherItemName}`);
        });
        if (!info.primaryReason) {
          info.primaryReason = `Clashes with ${columnClashes[0].otherItemName}`;
        }
      }
    });
  }

  const itemsWithIssues: FurnitureCollisionInfo[] = [];
  collisionMap.forEach((val) => {
    if (val.hasCollision) {
      itemsWithIssues.push(val);
    }
  });

  return {
    totalCollisions: itemsWithIssues.length,
    collidingItemCount: itemsWithIssues.length,
    outOfBoundsCount,
    furnitureOverlapCount,
    columnClashCount,
    collisionMap,
    itemsWithIssues,
  };
}

/**
 * Repositions a furniture item to fit cleanly inside room boundaries without protruding.
 */
export function clampItemToRoomBounds(item: FurnitureItem, roomWidthMm: number, roomDepthMm: number): FurnitureItem {
  let newX = item.x;
  let newY = item.y;

  if (newX < 0) newX = 0;
  if (newX + item.width > roomWidthMm) newX = Math.max(0, roomWidthMm - item.width);

  if (newY < 0) newY = 0;
  if (newY + item.depth > roomDepthMm) newY = Math.max(0, roomDepthMm - item.depth);

  return {
    ...item,
    x: Math.round(newX),
    y: Math.round(newY),
  };
}
