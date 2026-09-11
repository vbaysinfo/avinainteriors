import { generateId } from "./id";
import { findMaterial } from "./materials";
import {
  ComponentKind,
  ComponentRow,
  ComputedRow,
  CutPanel,
  Material,
  ProjectTotals,
  Room,
  Wall,
} from "./types";

export const FT_TO_MM = 304.8;

export function ftToMm(ft: number | null): number | null {
  if (ft === null || Number.isNaN(ft)) return null;
  return Math.round(ft * FT_TO_MM * 100) / 100;
}

/** Mirrors the reference workbook: blank/zero depth = Area (Sq.ft), any positive depth = Volume (Cu.ft). */
export function computeRow(row: ComponentRow): ComputedRow {
  const hasWidth = row.widthFt !== null && row.widthFt > 0;
  const hasHeight = row.heightFt !== null && row.heightFt > 0;
  const hasDepth = row.depthFt !== null && row.depthFt > 0;

  const widthMm = ftToMm(row.widthFt);
  const heightMm = ftToMm(row.heightFt);
  const depthMm = hasDepth ? ftToMm(row.depthFt) : null;

  let calcBasis: "area" | "volume" | null = null;
  let areaOrVolume: number | null = null;

  if (hasWidth && hasHeight) {
    if (hasDepth) {
      calcBasis = "volume";
      areaOrVolume = round((row.widthFt as number) * (row.heightFt as number) * (row.depthFt as number));
    } else {
      calcBasis = "area";
      areaOrVolume = round((row.widthFt as number) * (row.heightFt as number));
    }
  }

  const qty = row.qty || 1;
  const computedAmount = areaOrVolume !== null ? round(areaOrVolume * row.rate * qty) : 0;
  const amount = row.amountOverride !== null ? row.amountOverride : computedAmount;

  return {
    ...row,
    widthMm,
    heightMm,
    depthMm,
    calcBasis,
    areaOrVolume,
    amount,
  };
}

function round(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function computeProjectTotals(rooms: Room[], gstPercent: number, materials: Material[]): ProjectTotals {
  let totalAreaSqft = 0;
  let totalVolumeCuft = 0;
  let subtotal = 0;

  const materialMap = new Map<string, { areaSqft: number; volumeCuft: number; amount: number }>();
  const roomSubtotals: { room: string; amount: number }[] = [];

  for (const room of rooms) {
    let roomAmount = 0;
    for (const raw of room.components) {
      const row = computeRow(raw);
      if (row.calcBasis === "area" && row.areaOrVolume) {
        totalAreaSqft += row.areaOrVolume * (row.qty || 1);
      } else if (row.calcBasis === "volume" && row.areaOrVolume) {
        totalVolumeCuft += row.areaOrVolume * (row.qty || 1);
      }
      subtotal += row.amount;
      roomAmount += row.amount;

      const bucket = materialMap.get(row.materialId) ?? { areaSqft: 0, volumeCuft: 0, amount: 0 };
      if (row.calcBasis === "area" && row.areaOrVolume) {
        bucket.areaSqft += row.areaOrVolume * (row.qty || 1);
      } else if (row.calcBasis === "volume" && row.areaOrVolume) {
        bucket.volumeCuft += row.areaOrVolume * (row.qty || 1);
      }
      bucket.amount += row.amount;
      materialMap.set(row.materialId, bucket);
    }
    roomSubtotals.push({ room: room.name, amount: round(roomAmount) });
  }

  const gstAmount = round(subtotal * (gstPercent / 100));
  const grandTotal = round(subtotal + gstAmount);

  const materialUsage = Array.from(materialMap.entries()).map(([materialId, v]) => {
    const material = findMaterial(materials, materialId);
    return {
      materialId,
      materialName: material.name,
      materialSpec: material.spec,
      areaSqft: round(v.areaSqft),
      volumeCuft: round(v.volumeCuft),
      amount: round(v.amount),
    };
  });

  return {
    totalAreaSqft: round(totalAreaSqft),
    totalVolumeCuft: round(totalVolumeCuft),
    subtotal: round(subtotal),
    gstAmount,
    grandTotal,
    materialUsage,
    roomSubtotals,
  };
}

/**
 * Breaks each component into its physical cut panels for the cutting list.
 * Volume-basis components (boxes/drawers with a depth) decompose into a standard carcass:
 * two sides, top, bottom, back, and a shutter/door face. Area-basis components (shutters,
 * panels, frames) are a single flat panel at their own width x height.
 */
export function generateCutPanels(rooms: Room[], materials: Material[]): CutPanel[] {
  const panels: CutPanel[] = [];

  for (const room of rooms) {
    for (const raw of room.components) {
      const row = computeRow(raw);
      const material = findMaterial(materials, row.materialId);
      if (!row.widthMm || !row.heightMm) continue;

      if (row.calcBasis === "volume" && row.depthMm) {
        const t = material.thicknessMm || 18;
        const w = row.widthMm;
        const h = row.heightMm;
        const d = row.depthMm;
        const carcassPanels: { name: string; width: number; height: number }[] = [
          { name: "Left Side Panel", width: d, height: h },
          { name: "Right Side Panel", width: d, height: h },
          { name: "Top Panel", width: w - 2 * t, height: d },
          { name: "Bottom Panel", width: w - 2 * t, height: d },
          { name: "Back Panel", width: w - 2 * t, height: h - 2 * t },
          { name: "Shutter / Front Face", width: w, height: h },
        ];
        for (const p of carcassPanels) {
          panels.push({
            id: generateId("panel"),
            room: room.name,
            wall: row.wall,
            componentDescription: row.description,
            panelName: p.name,
            widthMm: round(Math.max(p.width, 0)),
            heightMm: round(Math.max(p.height, 0)),
            thicknessMm: t,
            materialName: material.name,
            qty: row.qty || 1,
          });
        }
      } else if (row.calcBasis === "area") {
        panels.push({
          id: generateId("panel"),
          room: room.name,
          wall: row.wall,
          componentDescription: row.description,
          panelName: row.description || "Panel",
          widthMm: row.widthMm,
          heightMm: row.heightMm,
          thicknessMm: material.thicknessMm || 18,
          materialName: material.name,
          qty: row.qty || 1,
        });
      }
    }
  }

  return panels;
}

const WALL_KEYWORDS: { wall: Wall; patterns: RegExp[] }[] = [
  { wall: "left", patterns: [/\bleft\b/i] },
  { wall: "right", patterns: [/\bright\b/i] },
  { wall: "back", patterns: [/\bback\b/i] },
  { wall: "front", patterns: [/\bfront\b/i, /\bopp(osite)?\b/i] },
];

export function inferWallFromText(text: string): Wall {
  for (const { wall, patterns } of WALL_KEYWORDS) {
    if (patterns.some((p) => p.test(text))) return wall;
  }
  return "front";
}

const KIND_KEYWORDS: { kind: ComponentKind; patterns: RegExp[] }[] = [
  { kind: "drawer", patterns: [/drawer/i, /tandom/i, /tandem/i] },
  {
    kind: "box",
    patterns: [/\bbox\b/i, /sitting box/i, /dressing box/i, /platform/i, /carcass/i],
  },
  {
    kind: "shutter",
    patterns: [/shutter/i, /loft/i, /profile door/i, /door/i],
  },
  {
    kind: "panel",
    patterns: [/panel/i, /panneling/i, /paneling/i, /expo/i, /back panel/i, /lover/i, /louver/i],
  },
];

export function inferKindFromText(text: string): ComponentKind {
  for (const { kind, patterns } of KIND_KEYWORDS) {
    if (patterns.some((p) => p.test(text))) return kind;
  }
  return "other";
}

export function emptyComponentRow(sno: number, defaultMaterial: Material): ComponentRow {
  return {
    id: generateId("row"),
    sno,
    room: "",
    description: "",
    kind: "shutter",
    widthFt: null,
    heightFt: null,
    depthFt: null,
    wall: "front",
    materialId: defaultMaterial.id,
    rate: defaultMaterial.ratePerSqft,
    qty: 1,
    amountOverride: null,
    remarks: "",
  };
}
