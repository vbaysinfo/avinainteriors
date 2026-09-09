import { FurnitureItem } from '../types/cad';

export interface VerticalBoxPreset {
  id: string;
  name: string;
  heightMm: number;
  description: string;
  category: 'wardrobe' | 'kitchen' | 'living' | 'office' | 'general';
}

export const VERTICAL_BOX_PRESETS: VerticalBoxPreset[] = [
  {
    id: 'shoes',
    name: 'Footwear & Shoes',
    heightMm: 180,
    description: '180mm: Heels, sneakers, flats & organizers',
    category: 'wardrobe',
  },
  {
    id: 'paperbacks',
    name: 'Paperbacks & Small Items',
    heightMm: 240,
    description: '240mm: Standard novels, mugs & small bins',
    category: 'living',
  },
  {
    id: 'books_crockery',
    name: 'Hardcovers & Crockery',
    heightMm: 300,
    description: '300mm: Dinner plates, glassware & hardcovers',
    category: 'kitchen',
  },
  {
    id: 'folded_clothes',
    name: 'Folded Clothes & Linens',
    heightMm: 350,
    description: '350mm: Standard folded shirts, sarees & towels',
    category: 'wardrobe',
  },
  {
    id: 'box_files',
    name: 'Box Files & Lever Binders',
    heightMm: 380,
    description: '380mm: Standard A4 lever arch office files',
    category: 'office',
  },
  {
    id: 'pantry_appliances',
    name: 'Pantry & Small Appliances',
    heightMm: 400,
    description: '400mm: Mixer, toaster, jars & cereal boxes',
    category: 'kitchen',
  },
  {
    id: 'tall_linens',
    name: 'Tall Storage & Blankets',
    heightMm: 450,
    description: '450mm: Quilts, pillows, tall boots & luggage',
    category: 'wardrobe',
  },
  {
    id: 'hanging_short',
    name: 'Short Hanging / Jackets',
    heightMm: 900,
    description: '900mm: Shirts, suits, jackets & short kurtas',
    category: 'wardrobe',
  },
];

export interface InternalSpaceBreakdown {
  totalHeight: number;
  carcassThickness: number;
  topPlyThickness: number;
  bottomPlyThickness: number;
  skirtingHeight: number;
  loftHeight: number;
  hasLoft: boolean;
  netInternalClearHeight: number;
  baseElevationFromFFL: number;
}

export interface VerticalBoxCompartment {
  index: number;
  name: string;
  clearHeightMm: number;
  bottomOffsetMm: number; // relative to inner bottom ply
  topOffsetMm: number; // relative to inner bottom ply
  elevationFromFFLMm: number; // relative to finished floor level
  isMasterBox?: boolean;
}

export interface InternalShelfLevel {
  index: number;
  offsetMm: number; // bottom of this shelf from inner bottom ply
  elevationFromFFLMm: number;
  thicknessMm: number;
}

export interface ShelfCalculationResult {
  totalShelves: number;
  totalBoxes: number;
  targetBoxHeight: number;
  averageBoxHeight: number;
  varianceFromTarget: number;
  mode: 'equal_boxes' | 'fixed_master_box';
  boxes: VerticalBoxCompartment[];
  shelves: InternalShelfLevel[];
  netInternalClearHeight: number;
  totalShelfThicknessMm: number;
  totalClearBoxSpaceMm: number;
  spaceUtilizationPercent: number;
}

/**
 * Computes exact internal clear cavity of a furniture cabinet
 */
export function calculateInternalCarcassSpace(item: FurnitureItem): InternalSpaceBreakdown {
  const totalHeight = item.height || 100;
  const carcassThickness = item.parametric.carcassThickness || 18;
  const topPlyThickness = carcassThickness;
  const bottomPlyThickness = carcassThickness;
  const skirtingHeight = item.parametric.skirtingHeight || 0;
  const hasLoft = Boolean(item.parametric.hasLoft && (item.parametric.loftHeight || 0) > 0);
  const loftHeight = hasLoft ? (item.parametric.loftHeight || 0) : 0;

  const netInternalClearHeight = Math.max(
    50,
    totalHeight - topPlyThickness - bottomPlyThickness - loftHeight - skirtingHeight
  );

  const baseElevationFromFFL = (item.z || 0) + skirtingHeight + bottomPlyThickness;

  return {
    totalHeight,
    carcassThickness,
    topPlyThickness,
    bottomPlyThickness,
    skirtingHeight,
    loftHeight,
    hasLoft,
    netInternalClearHeight,
    baseElevationFromFFL,
  };
}

/**
 * Automatically calculates optimal internal shelf count, individual compartment vertical boxes,
 * and exact shelf elevations based on user-defined target box height and remaining internal space.
 */
export function calculateShelfPlacement(
  item: FurnitureItem,
  targetBoxHeight: number = 350,
  mode: 'equal_boxes' | 'fixed_master_box' = 'equal_boxes',
  fixedBoxHeight: number = 450,
  fixedBoxPosition: 'bottom' | 'top' = 'bottom'
): ShelfCalculationResult {
  const space = calculateInternalCarcassSpace(item);
  const netH = space.netInternalClearHeight;
  const shelfThickness = space.carcassThickness;
  const safeTarget = Math.max(80, Math.min(netH, targetBoxHeight));

  const boxes: VerticalBoxCompartment[] = [];
  const shelves: InternalShelfLevel[] = [];

  if (mode === 'fixed_master_box') {
    // Mode 2: Fixed Master Box (e.g. bottom vault/boot box or top tall niche) + Distribute Remaining Internal Space
    const safeFixedH = Math.max(100, Math.min(netH - shelfThickness - 50, fixedBoxHeight));
    const remainingSpace = Math.max(50, netH - safeFixedH - shelfThickness);

    // Number of secondary boxes in remaining space
    const targetSecondary = safeTarget;
    const secondaryBoxesCount = Math.max(1, Math.round((remainingSpace + shelfThickness) / (targetSecondary + shelfThickness)));
    const secondaryShelvesCount = secondaryBoxesCount - 1;
    const totalShelves = 1 + secondaryShelvesCount;
    const totalBoxes = 1 + secondaryBoxesCount;

    const totalSecondaryShelvesThick = secondaryShelvesCount * shelfThickness;
    const netSecondaryClearSpace = remainingSpace - totalSecondaryShelvesThick;
    const baseSecondaryBoxH = Math.floor(netSecondaryClearSpace / secondaryBoxesCount);
    const secondaryRemainder = netSecondaryClearSpace - (baseSecondaryBoxH * secondaryBoxesCount);

    if (fixedBoxPosition === 'bottom') {
      // Master Box at Bottom
      boxes.push({
        index: 1,
        name: `Box 1 [Master Bottom]`,
        clearHeightMm: safeFixedH,
        bottomOffsetMm: 0,
        topOffsetMm: safeFixedH,
        elevationFromFFLMm: space.baseElevationFromFFL,
        isMasterBox: true,
      });

      // Master Shelf Separator
      let currentOffset = safeFixedH;
      shelves.push({
        index: 1,
        offsetMm: currentOffset,
        elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
        thicknessMm: shelfThickness,
      });
      currentOffset += shelfThickness;

      // Secondary Boxes in Remaining Upper Space
      for (let i = 0; i < secondaryBoxesCount; i++) {
        const extraMm = i === secondaryBoxesCount - 1 ? secondaryRemainder : 0;
        const boxH = baseSecondaryBoxH + extraMm;
        const boxIndex = i + 2;

        boxes.push({
          index: boxIndex,
          name: i === secondaryBoxesCount - 1 ? `Box ${boxIndex} [Top]` : `Box ${boxIndex}`,
          clearHeightMm: boxH,
          bottomOffsetMm: currentOffset,
          topOffsetMm: currentOffset + boxH,
          elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
          isMasterBox: false,
        });

        currentOffset += boxH;

        if (i < secondaryBoxesCount - 1) {
          shelves.push({
            index: shelves.length + 1,
            offsetMm: currentOffset,
            elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
            thicknessMm: shelfThickness,
          });
          currentOffset += shelfThickness;
        }
      }
    } else {
      // Master Box at Top
      let currentOffset = 0;

      // Secondary Boxes in Lower Space
      for (let i = 0; i < secondaryBoxesCount; i++) {
        const extraMm = i === 0 ? secondaryRemainder : 0;
        const boxH = baseSecondaryBoxH + extraMm;
        const boxIndex = i + 1;

        boxes.push({
          index: boxIndex,
          name: i === 0 ? `Box ${boxIndex} [Bottom]` : `Box ${boxIndex}`,
          clearHeightMm: boxH,
          bottomOffsetMm: currentOffset,
          topOffsetMm: currentOffset + boxH,
          elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
          isMasterBox: false,
        });

        currentOffset += boxH;

        if (i < secondaryBoxesCount) {
          shelves.push({
            index: shelves.length + 1,
            offsetMm: currentOffset,
            elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
            thicknessMm: shelfThickness,
          });
          currentOffset += shelfThickness;
        }
      }

      // Master Box at Top
      boxes.push({
        index: totalBoxes,
        name: `Box ${totalBoxes} [Master Top]`,
        clearHeightMm: safeFixedH,
        bottomOffsetMm: currentOffset,
        topOffsetMm: currentOffset + safeFixedH,
        elevationFromFFLMm: space.baseElevationFromFFL + currentOffset,
        isMasterBox: true,
      });
    }

    const totalShelfThicknessMm = totalShelves * shelfThickness;
    const totalClearBoxSpaceMm = netH - totalShelfThicknessMm;
    const averageBoxHeight = Math.round(totalClearBoxSpaceMm / totalBoxes * 10) / 10;
    const varianceFromTarget = Math.round((baseSecondaryBoxH - safeTarget) * 10) / 10;

    return {
      totalShelves,
      totalBoxes,
      targetBoxHeight: safeTarget,
      averageBoxHeight,
      varianceFromTarget,
      mode,
      boxes,
      shelves,
      netInternalClearHeight: netH,
      totalShelfThicknessMm,
      totalClearBoxSpaceMm,
      spaceUtilizationPercent: 100,
    };
  }

  // Mode 1: Equal Vertical Boxes across all available internal space
  // Given net clear height netH and shelf thickness t:
  // (N_boxes * BoxH) + ((N_boxes - 1) * t) = netH
  // N_boxes * (BoxH + t) = netH + t
  // N_boxes = round((netH + t) / (targetBoxHeight + t))
  const numBoxes = Math.max(1, Math.round((netH + shelfThickness) / (safeTarget + shelfThickness)));
  const numShelves = numBoxes - 1;

  const totalShelfThicknessMm = numShelves * shelfThickness;
  const totalClearBoxSpaceMm = netH - totalShelfThicknessMm;
  const baseBoxHeight = Math.floor(totalClearBoxSpaceMm / numBoxes);
  const remainderMm = totalClearBoxSpaceMm - (baseBoxHeight * numBoxes);

  let currentBottomOffset = 0;

  for (let i = 0; i < numBoxes; i++) {
    // Add remainder mm to the top box (or middle) for exact mathematical sum
    const extraMm = i === numBoxes - 1 ? remainderMm : 0;
    const boxClearH = baseBoxHeight + extraMm;
    const boxIndex = i + 1;

    let boxName = `Box ${boxIndex}`;
    if (numBoxes === 1) boxName = 'Full Cavity Box';
    else if (i === 0) boxName = `Box 1 [Bottom]`;
    else if (i === numBoxes - 1) boxName = `Box ${boxIndex} [Top]`;

    boxes.push({
      index: boxIndex,
      name: boxName,
      clearHeightMm: boxClearH,
      bottomOffsetMm: currentBottomOffset,
      topOffsetMm: currentBottomOffset + boxClearH,
      elevationFromFFLMm: space.baseElevationFromFFL + currentBottomOffset,
    });

    currentBottomOffset += boxClearH;

    // Shelf after this box (except top-most)
    if (i < numBoxes - 1) {
      shelves.push({
        index: i + 1,
        offsetMm: currentBottomOffset,
        elevationFromFFLMm: space.baseElevationFromFFL + currentBottomOffset,
        thicknessMm: shelfThickness,
      });
      currentBottomOffset += shelfThickness;
    }
  }

  const averageBoxHeight = Math.round(totalClearBoxSpaceMm / numBoxes * 10) / 10;
  const varianceFromTarget = Math.round((baseBoxHeight - safeTarget) * 10) / 10;

  return {
    totalShelves: numShelves,
    totalBoxes: numBoxes,
    targetBoxHeight: safeTarget,
    averageBoxHeight,
    varianceFromTarget,
    mode,
    boxes,
    shelves,
    netInternalClearHeight: netH,
    totalShelfThicknessMm,
    totalClearBoxSpaceMm,
    spaceUtilizationPercent: 100,
  };
}
