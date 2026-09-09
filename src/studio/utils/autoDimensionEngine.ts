import { Room, FurnitureItem, CadDimension } from '../types/cad';

export interface AutoDimensionLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distanceMm: number;
  label: string;
  orientation: 'horizontal' | 'vertical';
  type: 'wall_to_furniture' | 'furniture_to_furniture' | 'room_overall';
  sourceName?: string;
  targetName?: string;
}

/**
 * Calculates all intelligent wall-to-furniture and furniture-to-furniture dimensions
 */
export function calculateAutoDimensions(room: Room): AutoDimensionLine[] {
  const dimensions: AutoDimensionLine[] = [];
  const { widthMm, depthMm, furniture } = room;

  if (!furniture || furniture.length === 0) {
    // Return overall room dimensions if no furniture
    dimensions.push({
      id: 'dim_overall_w',
      x1: 0,
      y1: -80,
      x2: widthMm,
      y2: -80,
      distanceMm: widthMm,
      label: `${widthMm} mm (Room Width)`,
      orientation: 'horizontal',
      type: 'room_overall',
    });
    dimensions.push({
      id: 'dim_overall_d',
      x1: -80,
      y1: 0,
      x2: -80,
      y2: depthMm,
      distanceMm: depthMm,
      label: `${depthMm} mm (Room Depth)`,
      orientation: 'vertical',
      type: 'room_overall',
    });
    return dimensions;
  }

  // 1. WALL-TO-FURNITURE CLEARANCE DISTANCES
  furniture.forEach((item) => {
    const itemMidY = item.y + item.depth / 2;
    const itemMidX = item.x + item.width / 2;

    // A. Left Wall (x = 0) to Furniture Left Edge (x = item.x)
    const leftDist = Math.round(item.x);
    if (leftDist > 0) {
      dimensions.push({
        id: `dim_wall_left_${item.id}`,
        x1: 0,
        y1: itemMidY,
        x2: item.x,
        y2: itemMidY,
        distanceMm: leftDist,
        label: `${leftDist} mm`,
        orientation: 'horizontal',
        type: 'wall_to_furniture',
        sourceName: 'Left Wall',
        targetName: item.name,
      });
    }

    // B. Furniture Right Edge (x = item.x + item.width) to Right Wall (x = widthMm)
    const rightDist = Math.round(widthMm - (item.x + item.width));
    if (rightDist > 0) {
      dimensions.push({
        id: `dim_wall_right_${item.id}`,
        x1: item.x + item.width,
        y1: itemMidY,
        x2: widthMm,
        y2: itemMidY,
        distanceMm: rightDist,
        label: `${rightDist} mm`,
        orientation: 'horizontal',
        type: 'wall_to_furniture',
        sourceName: item.name,
        targetName: 'Right Wall',
      });
    }

    // C. Top Wall (y = 0) to Furniture Top Edge (y = item.y)
    const topDist = Math.round(item.y);
    if (topDist > 0) {
      dimensions.push({
        id: `dim_wall_top_${item.id}`,
        x1: itemMidX,
        y1: 0,
        x2: itemMidX,
        y2: item.y,
        distanceMm: topDist,
        label: `${topDist} mm`,
        orientation: 'vertical',
        type: 'wall_to_furniture',
        sourceName: 'Top Wall',
        targetName: item.name,
      });
    }

    // D. Furniture Bottom Edge (y = item.y + item.depth) to Bottom Wall (y = depthMm)
    const bottomDist = Math.round(depthMm - (item.y + item.depth));
    if (bottomDist > 0) {
      dimensions.push({
        id: `dim_wall_bottom_${item.id}`,
        x1: itemMidX,
        y1: item.y + item.depth,
        x2: itemMidX,
        y2: depthMm,
        distanceMm: bottomDist,
        label: `${bottomDist} mm`,
        orientation: 'vertical',
        type: 'wall_to_furniture',
        sourceName: item.name,
        targetName: 'Bottom Wall',
      });
    }
  });

  // 2. FURNITURE-TO-FURNITURE GAP DISTANCES
  for (let i = 0; i < furniture.length; i++) {
    for (let j = 0; j < furniture.length; j++) {
      if (i === j) continue;
      const itemA = furniture[i];
      const itemB = furniture[j];

      // Check Horizontal Gap (itemA is to the left of itemB)
      const aRight = itemA.x + itemA.width;
      const bLeft = itemB.x;
      const horizontalGap = Math.round(bLeft - aRight);

      // They should have vertical overlap to measure direct horizontal clearance
      const yOverlap = Math.max(0, Math.min(itemA.y + itemA.depth, itemB.y + itemB.depth) - Math.max(itemA.y, itemB.y));

      if (horizontalGap > 0 && horizontalGap <= 3000 && yOverlap > 20) {
        // Compute shared Y center for dimension line
        const sharedY = (Math.max(itemA.y, itemB.y) + Math.min(itemA.y + itemA.depth, itemB.y + itemB.depth)) / 2;
        dimensions.push({
          id: `dim_f2f_h_${itemA.id}_${itemB.id}`,
          x1: aRight,
          y1: sharedY,
          x2: bLeft,
          y2: sharedY,
          distanceMm: horizontalGap,
          label: `${horizontalGap} mm`,
          orientation: 'horizontal',
          type: 'furniture_to_furniture',
          sourceName: itemA.name,
          targetName: itemB.name,
        });
      }

      // Check Vertical Gap (itemA is above itemB)
      const aBottom = itemA.y + itemA.depth;
      const bTop = itemB.y;
      const verticalGap = Math.round(bTop - aBottom);

      // They should have horizontal overlap to measure direct vertical clearance
      const xOverlap = Math.max(0, Math.min(itemA.x + itemA.width, itemB.x + itemB.width) - Math.max(itemA.x, itemB.x));

      if (verticalGap > 0 && verticalGap <= 3000 && xOverlap > 20) {
        // Compute shared X center for dimension line
        const sharedX = (Math.max(itemA.x, itemB.x) + Math.min(itemA.x + itemA.width, itemB.x + itemB.width)) / 2;
        dimensions.push({
          id: `dim_f2f_v_${itemA.id}_${itemB.id}`,
          x1: sharedX,
          y1: aBottom,
          x2: sharedX,
          y2: bTop,
          distanceMm: verticalGap,
          label: `${verticalGap} mm`,
          orientation: 'vertical',
          type: 'furniture_to_furniture',
          sourceName: itemA.name,
          targetName: itemB.name,
        });
      }
    }
  }

  // 3. Chain Dimensions for Top / Bottom Wall strings
  // Sort items along X-axis
  const sortedByX = [...furniture].sort((a, b) => a.x - b.x);
  if (sortedByX.length > 0) {
    // Add top overall dimension string
    dimensions.push({
      id: 'dim_overall_top_chain',
      x1: 0,
      y1: -120,
      x2: widthMm,
      y2: -120,
      distanceMm: widthMm,
      label: `TOTAL WIDTH: ${widthMm} mm`,
      orientation: 'horizontal',
      type: 'room_overall',
    });
    // Add left overall dimension string
    dimensions.push({
      id: 'dim_overall_left_chain',
      x1: -120,
      y1: 0,
      x2: -120,
      y2: depthMm,
      distanceMm: depthMm,
      label: `TOTAL DEPTH: ${depthMm} mm`,
      orientation: 'vertical',
      type: 'room_overall',
    });
  }

  return dimensions;
}

/**
 * Converts AutoDimensionLine[] to CadDimension[] that can be persisted in room.dimensions
 */
export function generateCadDimensionsForRoom(room: Room): CadDimension[] {
  const autoDims = calculateAutoDimensions(room);
  return autoDims.map((ad) => ({
    id: ad.id,
    x1: ad.x1,
    y1: ad.y1,
    x2: ad.x2,
    y2: ad.y2,
    offset: 0,
    textOverride: ad.label,
    type: 'linear',
  }));
}
