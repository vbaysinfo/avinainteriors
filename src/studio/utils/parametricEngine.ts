import { FurnitureItem, CuttingItem, ParametricDetails } from '../types/cad';
import { MATERIAL_PALETTE } from '../data/furnitureCatalog';
import { calculateShelfPlacement } from './shelfCalculations';

/**
 * Automatically recalculates parametric components (shutters, divisions, shelves, hardware)
 * when Width, Height, or Depth changes, while preserving explicit user overrides.
 */
export function recalculateParametricFurniture(item: FurnitureItem, newWidth?: number, newHeight?: number, newDepth?: number): FurnitureItem {
  const width = Math.round(newWidth ?? item.width);
  const height = Math.round(newHeight ?? item.height);
  const depth = Math.round(newDepth ?? item.depth);

  const updatedParametric: ParametricDetails = { ...item.parametric };

  // If autoAdjustShelves is enabled and targetVerticalBoxHeight is specified,
  // automatically calculate and adjust shelf placement based on new height and remaining internal space
  if (updatedParametric.autoAdjustShelves && updatedParametric.targetVerticalBoxHeight) {
    const tempItem: FurnitureItem = { ...item, height, parametric: updatedParametric };
    const shelfCalc = calculateShelfPlacement(
      tempItem,
      updatedParametric.targetVerticalBoxHeight,
      updatedParametric.verticalBoxMode || 'equal_boxes',
      updatedParametric.fixedBoxHeight || 450,
      updatedParametric.fixedBoxPosition || 'bottom'
    );
    updatedParametric.shelfCount = shelfCalc.totalShelves;
  }

  // Only calculate automatic shutter count if width is explicitly changed AND shutter count was not custom set,
  // or if shutterCount is undefined
  if (newWidth !== undefined && updatedParametric.shutterCount === undefined) {
    if (item.category === 'wardrobe') {
      if (updatedParametric.shutterType === 'sliding') {
        updatedParametric.shutterCount = width > 2200 ? 3 : 2;
      } else if (updatedParametric.shutterType !== 'open') {
        // Standard hinged shutter width is 400mm - 550mm
        updatedParametric.shutterCount = Math.max(1, Math.min(6, Math.round(width / 480)));
      }
    } else if (item.category === 'kitchen') {
      if (item.catalogId.includes('drawer')) {
        updatedParametric.shutterCount = 0;
        updatedParametric.drawerCount = height > 700 ? 3 : 2;
      } else if (item.catalogId.includes('bottle_pullout')) {
        updatedParametric.shutterCount = 1;
        updatedParametric.drawerCount = 1;
      } else if (updatedParametric.shutterType !== 'open') {
        updatedParametric.shutterCount = width <= 500 ? 1 : Math.max(1, Math.min(4, Math.round(width / 450)));
      }
    } else if (item.category === 'tv_unit') {
      if (updatedParametric.shutterType !== 'open') {
        updatedParametric.shutterCount = Math.max(1, Math.min(4, Math.round(width / 550)));
      }
    }
  }

  // Calculate hardware based on the current/updated shutterCount and height
  const hingesPerShutter = height > 2100 ? 4 : height > 1500 ? 3 : 2;
  const sCount = updatedParametric.shutterCount ?? 0;
  const dCount = updatedParametric.drawerCount ?? 0;
  
  if (updatedParametric.shutterType === 'sliding' || updatedParametric.shutterType === 'open') {
    updatedParametric.hingesCount = 0;
  } else {
    updatedParametric.hingesCount = sCount * hingesPerShutter;
  }
  
  updatedParametric.slidePairs = dCount;
  updatedParametric.handlesCount = sCount + dCount;
  updatedParametric.legsCount = width > 1500 ? 6 : 4;

  return {
    ...item,
    width,
    height,
    depth,
    parametric: updatedParametric,
  };
}

/**
 * Mirrors a furniture item horizontally or vertically.
 * Preserves parametric hardware constraints (hinge counts, slide pairs, handles, legs),
 * reverses internal section layout (drawers, hanging rods, shelving zones),
 * and flips orientation while maintaining dimensional and BOM consistency.
 */
export function mirrorFurnitureItem(item: FurnitureItem, direction: 'horizontal' | 'vertical' = 'horizontal'): FurnitureItem {
  const updatedParametric: ParametricDetails = { ...item.parametric };

  // If item has internal sections config, reverse their order to mirror the interior compartments
  if (updatedParametric.internalSections && updatedParametric.internalSections.length > 1) {
    updatedParametric.internalSections = [...updatedParametric.internalSections].reverse();
  }

  // Preserve and enforce hardware constraints
  const hingesPerShutter = item.height > 2100 ? 4 : item.height > 1500 ? 3 : 2;
  const expectedHinges = (updatedParametric.shutterCount || 0) * hingesPerShutter;
  updatedParametric.hingesCount = updatedParametric.hingesCount ? updatedParametric.hingesCount : expectedHinges;
  updatedParametric.slidePairs = updatedParametric.slidePairs !== undefined ? updatedParametric.slidePairs : (updatedParametric.drawerCount || 0);
  updatedParametric.handlesCount = (updatedParametric.shutterCount || 0) + (updatedParametric.drawerCount || 0);
  updatedParametric.legsCount = item.width > 1500 ? 6 : 4;

  if (direction === 'horizontal') {
    return {
      ...item,
      // For single asymmetric units or mirrored rotation
      parametric: updatedParametric,
    };
  } else {
    // Vertical flip (e.g. wall vs base orientation or 180 flip)
    return {
      ...item,
      rotation: (item.rotation + 180) % 360,
      parametric: updatedParametric,
    };
  }
}

/**
 * Generates panel-by-panel cutting list (MaxCut format) for a list of furniture items.
 */
export function generateCuttingList(furnitureList: FurnitureItem[]): CuttingItem[] {
  const cuttingItems: CuttingItem[] = [];

  furnitureList.forEach((item) => {
    const { width, height, depth, parametric, materials, name, id, category } = item;
    const carcassThick = parametric.carcassThickness || 18;
    const backThick = parametric.backPlyThickness || 9;
    const shutterCount = parametric.shutterCount || 0;
    const drawerCount = parametric.drawerCount || 0;
    const shelfCount = parametric.shelfCount || 0;

    // 1. Left & Right Side Panels (Carcass)
    cuttingItems.push({
      id: `${id}_side_panels`,
      partName: 'Side Panel (Carcase)',
      parentFurnitureId: id,
      parentFurnitureName: name,
      category,
      qty: 2,
      length: height,
      width: depth,
      thickness: carcassThick,
      material: materials.carcassMaterial || '18mm BWP Plywood',
      finish: materials.carcassFinish || 'Frosty White',
      color: '#F3F4F6',
      edgeBandingSides: { top: false, bottom: false, left: true, right: true },
      edgeBandingThickness: 0.8,
      grainDirection: 'length',
      remarks: 'Pre-drilled 32mm system holes for shelf pins',
    });

    // 2. Top & Bottom Carcass Panels
    const topBottomWidth = Math.max(100, width - 2 * carcassThick);
    cuttingItems.push({
      id: `${id}_bottom_panel`,
      partName: 'Bottom Panel (Carcase)',
      parentFurnitureId: id,
      parentFurnitureName: name,
      category,
      qty: 1,
      length: topBottomWidth,
      width: depth,
      thickness: carcassThick,
      material: materials.carcassMaterial || '18mm BWP Plywood',
      finish: materials.carcassFinish || 'Frosty White',
      color: '#F3F4F6',
      edgeBandingSides: { top: true, bottom: false, left: false, right: false },
      edgeBandingThickness: 0.8,
      grainDirection: 'length',
    });

    if (item.category !== 'kitchen' || !parametric.hasCountertop) {
      cuttingItems.push({
        id: `${id}_top_panel`,
        partName: 'Top Panel (Carcase)',
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: 1,
        length: topBottomWidth,
        width: depth,
        thickness: carcassThick,
        material: materials.carcassMaterial || '18mm BWP Plywood',
        finish: materials.carcassFinish || 'Frosty White',
        color: '#F3F4F6',
        edgeBandingSides: { top: true, bottom: false, left: false, right: false },
        edgeBandingThickness: 0.8,
        grainDirection: 'length',
      });
    }

    // 3. Back Panel
    if (backThick > 0) {
      cuttingItems.push({
        id: `${id}_back_panel`,
        partName: 'Back Ply Panel',
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: 1,
        length: Math.max(100, height - 20),
        width: Math.max(100, width - 20),
        thickness: backThick,
        material: `${backThick}mm Back Ply`,
        finish: 'White Melamine 1-side',
        color: '#FFFFFF',
        edgeBandingSides: { top: false, bottom: false, left: false, right: false },
        edgeBandingThickness: 0,
        grainDirection: 'length',
        remarks: 'Rebate / Groove 8mm deep into sides',
      });
    }

    // 4. Internal Vertical Dividers (if multi-shutter wardrobe / unit)
    const dividerCount = shutterCount > 1 ? Math.floor((shutterCount - 1)) : 0;
    if (dividerCount > 0 && category === 'wardrobe') {
      const dividerHeight = Math.max(100, height - 2 * carcassThick);
      cuttingItems.push({
        id: `${id}_dividers`,
        partName: 'Vertical Partition / Divider',
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: dividerCount,
        length: dividerHeight,
        width: Math.max(100, depth - 30),
        thickness: carcassThick,
        material: materials.carcassMaterial || '18mm BWP Plywood',
        finish: materials.carcassFinish || 'Frosty White',
        color: '#F3F4F6',
        edgeBandingSides: { top: true, bottom: false, left: false, right: false },
        edgeBandingThickness: 0.8,
        grainDirection: 'length',
      });
    }

    // 5. Internal Shelves
    if (shelfCount > 0) {
      const compartments = dividerCount + 1;
      const shelfSpan = Math.max(100, Math.round((width - 2 * carcassThick - dividerCount * carcassThick) / compartments));
      cuttingItems.push({
        id: `${id}_shelves`,
        partName: 'Internal Adjustable Shelf',
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: shelfCount,
        length: shelfSpan,
        width: Math.max(100, depth - 40),
        thickness: carcassThick,
        material: materials.carcassMaterial || '18mm BWP Plywood',
        finish: materials.carcassFinish || 'Frosty White',
        color: '#F3F4F6',
        edgeBandingSides: { top: true, bottom: true, left: true, right: true },
        edgeBandingThickness: 0.8,
        grainDirection: 'length',
      });
    }

    // 6. External Shutters / Doors
    if (shutterCount > 0 && parametric.shutterType !== 'open') {
      const shutterWidth = Math.max(100, Math.round((width - 4 - (shutterCount - 1) * 3) / shutterCount));
      const shutterHeight = Math.max(100, height - (parametric.skirtingHeight || 0) - 6);
      cuttingItems.push({
        id: `${id}_shutters`,
        partName: `Front Shutter (${parametric.shutterType})`,
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: shutterCount,
        length: shutterHeight,
        width: shutterWidth,
        thickness: 18,
        material: materials.shutterMaterial || 'MDF / HDHMR',
        finish: materials.shutterFinish || 'Acrylic Gloss',
        color: materials.shutterColor || '#FAFAFA',
        edgeBandingSides: { top: true, bottom: true, left: true, right: true },
        edgeBandingThickness: 2.0,
        grainDirection: 'length',
        remarks: '2.0mm matching seamless PVC edge-band',
      });
    }

    // 7. Drawer Components
    if (drawerCount > 0) {
      const drawerHeight = Math.round((height - 100) / drawerCount);
      // Drawer Front
      cuttingItems.push({
        id: `${id}_drawer_fronts`,
        partName: 'Drawer Front Panel',
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: drawerCount,
        length: drawerHeight - 5,
        width: width - 6,
        thickness: 18,
        material: materials.shutterMaterial || 'MDF / HDHMR',
        finish: materials.shutterFinish || 'Acrylic Gloss',
        color: materials.shutterColor || '#FAFAFA',
        edgeBandingSides: { top: true, bottom: true, left: true, right: true },
        edgeBandingThickness: 2.0,
        grainDirection: 'width',
      });
    }

    // 8. Countertop Slab
    if (parametric.hasCountertop && parametric.countertopMaterial) {
      const topLength = width + (parametric.countertopOverhang || 25) * 2;
      const topWidth = depth + (parametric.countertopOverhang || 25);
      cuttingItems.push({
        id: `${id}_countertop`,
        partName: `Countertop (${parametric.countertopMaterial})`,
        parentFurnitureId: id,
        parentFurnitureName: name,
        category,
        qty: 1,
        length: topLength,
        width: topWidth,
        thickness: parametric.countertopThickness || 20,
        material: parametric.countertopMaterial,
        finish: 'Polished Factory Edge',
        color: '#EAE6DF',
        edgeBandingSides: { top: false, bottom: false, left: false, right: false },
        edgeBandingThickness: 0,
        grainDirection: 'none',
        remarks: 'Double-chamfer pencil edge polish on exposed sides',
      });
    }
  });

  return cuttingItems;
}

export interface QuotationSummary {
  carcassAreaSqFt: number;
  carcassCost: number;
  shutterAreaSqFt: number;
  shutterCost: number;
  countertopAreaSqFt: number;
  countertopCost: number;
  hardwareCost: number;
  edgeBandingMeters: number;
  edgeBandingCost: number;
  laborCost: number;
  totalCost: number;
  itemizedFurniture: Array<{
    id: string;
    name: string;
    dimensions: string;
    totalSqFt: number;
    estimatedCost: number;
  }>;
}

export function calculateQuotation(furnitureList: FurnitureItem[]): QuotationSummary {
  let totalCarcassSqFt = 0;
  let totalShutterSqFt = 0;
  let totalCounterSqFt = 0;
  let totalEdgeMeters = 0;
  let totalHinges = 0;
  let totalSlides = 0;
  let totalHandles = 0;

  const itemizedFurniture: QuotationSummary['itemizedFurniture'] = [];

  furnitureList.forEach((item) => {
    const wFt = item.width / 304.8;
    const hFt = item.height / 304.8;
    const dFt = item.depth / 304.8;

    // Carcass surface area approx (2 sides + top + bottom + back + shelves)
    const carcassSqFt = 2 * (hFt * dFt) + 2 * (wFt * dFt) + (wFt * hFt) + (item.parametric.shelfCount || 0) * (wFt * dFt);
    totalCarcassSqFt += carcassSqFt;

    // Shutter area
    const shutterSqFt = (item.parametric.shutterCount || 0) > 0 ? (wFt * hFt) : 0;
    totalShutterSqFt += shutterSqFt;

    // Counter area
    if (item.parametric.hasCountertop) {
      const counterSqFt = wFt * dFt;
      totalCounterSqFt += counterSqFt;
    }

    // Edge banding (meters)
    const edgeMeters = ((item.width * 2 + item.height * 2) / 1000) * ((item.parametric.shutterCount || 1) + 2);
    totalEdgeMeters += edgeMeters;

    totalHinges += item.parametric.hingesCount || 0;
    totalSlides += item.parametric.slidePairs || 0;
    totalHandles += item.parametric.handlesCount || 0;

    const itemSqFt = Math.round((wFt * hFt) * 10) / 10;
    const itemCost = Math.round(itemSqFt * 1650); // Average interior rate per elevation sq.ft

    itemizedFurniture.push({
      id: item.id,
      name: item.name,
      dimensions: `${item.width} × ${item.height} × ${item.depth} mm`,
      totalSqFt: itemSqFt,
      estimatedCost: itemCost,
    });
  });

  const carcassRate = 160; // Rs/SqFt
  const shutterRate = 310; // Rs/SqFt
  const counterRate = 420; // Rs/SqFt
  const hingePrice = 280; // Soft close hinge pair
  const slidePrice = 1850; // Tandem soft close slide
  const handlePrice = 250; // G-profile/Lip handle
  const edgeRate = 45; // Rs/meter

  const carcassCost = Math.round(totalCarcassSqFt * carcassRate);
  const shutterCost = Math.round(totalShutterSqFt * shutterRate);
  const countertopCost = Math.round(totalCounterSqFt * counterRate);
  const edgeBandingCost = Math.round(totalEdgeMeters * edgeRate);
  const hardwareCost = Math.round(
    (totalHinges / 2) * hingePrice + totalSlides * slidePrice + totalHandles * handlePrice + furnitureList.length * 400
  );

  const subtotal = carcassCost + shutterCost + countertopCost + edgeBandingCost + hardwareCost;
  const laborCost = Math.round(subtotal * 0.18);
  const totalCost = subtotal + laborCost;

  return {
    carcassAreaSqFt: Math.round(totalCarcassSqFt * 10) / 10,
    carcassCost,
    shutterAreaSqFt: Math.round(totalShutterSqFt * 10) / 10,
    shutterCost,
    countertopAreaSqFt: Math.round(totalCounterSqFt * 10) / 10,
    countertopCost,
    hardwareCost,
    edgeBandingMeters: Math.round(totalEdgeMeters),
    edgeBandingCost,
    laborCost,
    totalCost,
    itemizedFurniture,
  };
}

export interface MaterialUsageSummary {
  totalPieces: number;
  totalFurnitureUnits: number;
  furnitureBreakdown: Array<{
    furnitureId: string;
    furnitureName: string;
    category: string;
    dimensions: string;
    pieceCount: number;
    carcassSqFt: number;
    shutterSqFt: number;
    edgeBandingMeters: number;
    items: CuttingItem[];
  }>;
  sheets: {
    carcass18mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      sheets7x4: number;
      thickness: number;
      description: string;
    };
    backPly8mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      sheets7x4: number;
      thickness: number;
      description: string;
    };
    shutterBoard18mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      sheets7x4: number;
      thickness: number;
      description: string;
    };
    totalCoreSheets8x4: number;
  };
  laminates: {
    innerLiner08mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      description: string;
    };
    outerDecorative1mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      description: string;
    };
    shutterBalancing08mm: {
      netSqFt: number;
      grossSqFt: number;
      sheets8x4: number;
      description: string;
    };
    totalLaminateSheets8x4: number;
  };
  edgeBanding: {
    carcassEB08mm: {
      netMeters: number;
      grossMeters: number;
      rolls50m: number;
      description: string;
    };
    shutterEB20mm: {
      netMeters: number;
      grossMeters: number;
      rolls50m: number;
      description: string;
    };
    totalRunningMeters: number;
  };
  hardwareAndConsumables: {
    hingesPairs: number;
    slidePairs: number;
    handlesNos: number;
    legsNos: number;
    minifixSets: number;
    shelfPinsNos: number;
    fevicolGlueKg: number;
    screws50mmNos: number;
    screws16mmNos: number;
  };
}

/**
 * Calculates complete production material usage, total pieces per room,
 * commercial sheet optimization (8'x4'), laminate counts, and edge binding meters.
 */
export function calculateMaterialUsage(furnitureList: FurnitureItem[]): MaterialUsageSummary {
  const cuttingItems = generateCuttingList(furnitureList);
  const totalPieces = cuttingItems.reduce((sum, item) => sum + item.qty, 0);

  let carcassAreaSqMm = 0;
  let backPlyAreaSqMm = 0;
  let shutterAreaSqMm = 0;

  let eb08RunningMm = 0;
  let eb20RunningMm = 0;

  const furnitureMap = new Map<string, {
    furnitureId: string;
    furnitureName: string;
    category: string;
    dimensions: string;
    pieceCount: number;
    carcassSqFt: number;
    shutterSqFt: number;
    edgeBandingMeters: number;
    items: CuttingItem[];
  }>();

  furnitureList.forEach((f) => {
    furnitureMap.set(f.id, {
      furnitureId: f.id,
      furnitureName: f.name,
      category: f.category,
      dimensions: `${f.width} × ${f.height} × ${f.depth} mm`,
      pieceCount: 0,
      carcassSqFt: 0,
      shutterSqFt: 0,
      edgeBandingMeters: 0,
      items: [],
    });
  });

  cuttingItems.forEach((item) => {
    const pieceAreaSqMm = item.length * item.width * item.qty;
    const pieceSqFt = pieceAreaSqMm / 92903.04;

    // Calculate edge banding running length
    let itemEbLengthMm = 0;
    if (item.edgeBandingSides.top) itemEbLengthMm += item.length;
    if (item.edgeBandingSides.bottom) itemEbLengthMm += item.length;
    if (item.edgeBandingSides.left) itemEbLengthMm += item.width;
    if (item.edgeBandingSides.right) itemEbLengthMm += item.width;
    const totalItemEbMm = itemEbLengthMm * item.qty;

    if (item.edgeBandingThickness >= 1.5) {
      eb20RunningMm += totalItemEbMm;
    } else if (item.edgeBandingThickness > 0) {
      eb08RunningMm += totalItemEbMm;
    }

    const isBackPly = item.partName.toLowerCase().includes('back') || item.thickness <= 10;
    const isShutter = item.partName.toLowerCase().includes('shutter') || item.partName.toLowerCase().includes('door') || item.partName.toLowerCase().includes('drawer front');
    const isCounter = item.partName.toLowerCase().includes('countertop');

    if (!isCounter) {
      if (isBackPly) {
        backPlyAreaSqMm += pieceAreaSqMm;
      } else if (isShutter) {
        shutterAreaSqMm += pieceAreaSqMm;
      } else {
        carcassAreaSqMm += pieceAreaSqMm;
      }
    }

    const fEntry = furnitureMap.get(item.parentFurnitureId);
    if (fEntry) {
      fEntry.pieceCount += item.qty;
      fEntry.edgeBandingMeters += Math.round((totalItemEbMm / 1000) * 10) / 10;
      fEntry.items.push(item);
      if (isShutter) {
        fEntry.shutterSqFt += Math.round(pieceSqFt * 10) / 10;
      } else if (!isBackPly && !isCounter) {
        fEntry.carcassSqFt += Math.round(pieceSqFt * 10) / 10;
      }
    }
  });

  // Convert Sq.mm to Sq.Ft (1 sq.ft = 92,903.04 sq.mm)
  const carcassNetSqFt = carcassAreaSqMm / 92903.04;
  const backPlyNetSqFt = backPlyAreaSqMm / 92903.04;
  const shutterNetSqFt = shutterAreaSqMm / 92903.04;

  // Wastage allowances (standard 12% for core boards, 10% for laminates)
  const carcassGrossSqFt = carcassNetSqFt * 1.12;
  const backPlyGrossSqFt = backPlyNetSqFt * 1.10;
  const shutterGrossSqFt = shutterNetSqFt * 1.10;

  // 8x4 Sheet = 32 Sq.Ft, 7x4 Sheet = 28 Sq.Ft
  const carcassSheets8x4 = carcassNetSqFt > 0 ? Math.ceil(carcassGrossSqFt / 32) : 0;
  const carcassSheets7x4 = carcassNetSqFt > 0 ? Math.ceil(carcassGrossSqFt / 28) : 0;

  const backPlySheets8x4 = backPlyNetSqFt > 0 ? Math.ceil(backPlyGrossSqFt / 32) : 0;
  const backPlySheets7x4 = backPlyNetSqFt > 0 ? Math.ceil(backPlyGrossSqFt / 28) : 0;

  const shutterSheets8x4 = shutterNetSqFt > 0 ? Math.ceil(shutterGrossSqFt / 32) : 0;
  const shutterSheets7x4 = shutterNetSqFt > 0 ? Math.ceil(shutterGrossSqFt / 28) : 0;

  // Laminates Calculation
  // 1. Inner liner 0.8mm (both faces of carcass panels)
  const innerLinerNetSqFt = carcassNetSqFt * 2;
  const innerLinerGrossSqFt = innerLinerNetSqFt * 1.10;
  const innerLinerSheets8x4 = innerLinerNetSqFt > 0 ? Math.ceil(innerLinerGrossSqFt / 32) : 0;

  // 2. Outer decorative 1mm / Acrylic (front face of shutters + exposed units)
  const outerDecorativeNetSqFt = shutterNetSqFt;
  const outerDecorativeGrossSqFt = outerDecorativeNetSqFt * 1.10;
  const outerDecorativeSheets8x4 = outerDecorativeNetSqFt > 0 ? Math.ceil(outerDecorativeGrossSqFt / 32) : 0;

  // 3. Shutter balancing 0.8mm (rear face of shutters)
  const shutterBalancingNetSqFt = shutterNetSqFt;
  const shutterBalancingGrossSqFt = shutterBalancingNetSqFt * 1.10;
  const shutterBalancingSheets8x4 = shutterBalancingNetSqFt > 0 ? Math.ceil(shutterBalancingGrossSqFt / 32) : 0;

  // Edge Banding Running Meters
  const eb08NetM = eb08RunningMm / 1000;
  const eb08GrossM = Math.round(eb08NetM * 1.10);
  const eb08Rolls50m = Math.ceil(eb08GrossM / 50);

  const eb20NetM = eb20RunningMm / 1000;
  const eb20GrossM = Math.round(eb20NetM * 1.10);
  const eb20Rolls50m = Math.ceil(eb20GrossM / 50);

  // Hardware & Consumables
  const totalHinges = furnitureList.reduce((sum, f) => sum + (f.parametric.hingesCount || 0), 0);
  const totalSlides = furnitureList.reduce((sum, f) => sum + (f.parametric.slidePairs || 0), 0);
  const totalHandles = furnitureList.reduce((sum, f) => sum + (f.parametric.handlesCount || 0), 0);
  const totalLegs = furnitureList.reduce((sum, f) => sum + (f.parametric.legsCount || 0), 0);
  const totalShelves = furnitureList.reduce((sum, f) => sum + (f.parametric.shelfCount || 0), 0);

  const totalLaminateSqFt = innerLinerGrossSqFt + outerDecorativeGrossSqFt + shutterBalancingGrossSqFt;
  const fevicolGlueKg = Math.max(1, Math.round(totalLaminateSqFt * 0.12));

  return {
    totalPieces,
    totalFurnitureUnits: furnitureList.length,
    furnitureBreakdown: Array.from(furnitureMap.values()),
    sheets: {
      carcass18mm: {
        netSqFt: Math.round(carcassNetSqFt * 10) / 10,
        grossSqFt: Math.round(carcassGrossSqFt * 10) / 10,
        sheets8x4: carcassSheets8x4,
        sheets7x4: carcassSheets7x4,
        thickness: 18,
        description: '18mm BWP Plywood / HDHMR Core (Carcass & Shelves)',
      },
      backPly8mm: {
        netSqFt: Math.round(backPlyNetSqFt * 10) / 10,
        grossSqFt: Math.round(backPlyGrossSqFt * 10) / 10,
        sheets8x4: backPlySheets8x4,
        sheets7x4: backPlySheets7x4,
        thickness: 8,
        description: '8mm / 9mm Backing Plywood 1-Side White Melamine',
      },
      shutterBoard18mm: {
        netSqFt: Math.round(shutterNetSqFt * 10) / 10,
        grossSqFt: Math.round(shutterGrossSqFt * 10) / 10,
        sheets8x4: shutterSheets8x4,
        sheets7x4: shutterSheets7x4,
        thickness: 18,
        description: '18mm HDHMR / MDF Shutter Substrate Core',
      },
      totalCoreSheets8x4: carcassSheets8x4 + backPlySheets8x4 + shutterSheets8x4,
    },
    laminates: {
      innerLiner08mm: {
        netSqFt: Math.round(innerLinerNetSqFt * 10) / 10,
        grossSqFt: Math.round(innerLinerGrossSqFt * 10) / 10,
        sheets8x4: innerLinerSheets8x4,
        description: '0.8mm Frosty White Inner Liner Laminate (Both Carcass Faces)',
      },
      outerDecorative1mm: {
        netSqFt: Math.round(outerDecorativeNetSqFt * 10) / 10,
        grossSqFt: Math.round(outerDecorativeGrossSqFt * 10) / 10,
        sheets8x4: outerDecorativeSheets8x4,
        description: '1.0mm - 1.5mm Decorative Shutter Laminate / Acrylic Gloss',
      },
      shutterBalancing08mm: {
        netSqFt: Math.round(shutterBalancingNetSqFt * 10) / 10,
        grossSqFt: Math.round(shutterBalancingGrossSqFt * 10) / 10,
        sheets8x4: shutterBalancingSheets8x4,
        description: '0.8mm Shutter Balancing White Backer (Anti-Warp)',
      },
      totalLaminateSheets8x4: innerLinerSheets8x4 + outerDecorativeSheets8x4 + shutterBalancingSheets8x4,
    },
    edgeBanding: {
      carcassEB08mm: {
        netMeters: Math.round(eb08NetM * 10) / 10,
        grossMeters: eb08GrossM,
        rolls50m: eb08Rolls50m,
        description: '0.8mm PVC Carcass Matching Edge Band (Sides, Shelves, Partitions)',
      },
      shutterEB20mm: {
        netMeters: Math.round(eb20NetM * 10) / 10,
        grossMeters: eb20GrossM,
        rolls50m: eb20Rolls50m,
        description: '2.0mm Heavy-Duty PVC Shutter Edge Band (4 Edges of Doors & Drawers)',
      },
      totalRunningMeters: eb08GrossM + eb20GrossM,
    },
    hardwareAndConsumables: {
      hingesPairs: totalHinges,
      slidePairs: totalSlides,
      handlesNos: totalHandles,
      legsNos: totalLegs,
      minifixSets: furnitureList.length * 16,
      shelfPinsNos: totalShelves * 4,
      fevicolGlueKg,
      screws50mmNos: furnitureList.length * 24,
      screws16mmNos: furnitureList.length * 48,
    },
  };
}
