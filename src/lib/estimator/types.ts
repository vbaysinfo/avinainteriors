// Core domain types for the modular-factory estimation tool.

export type ProjectType = "semi" | "full";

export type Wall = "front" | "left" | "right" | "back" | "unassigned";

export type CalcBasis = "area" | "volume";

/** Component kind decides which dimension fields are editable/fixed. */
export type ComponentKind = "shutter" | "box" | "drawer" | "panel" | "other";

export interface Material {
  id: string;
  name: string;
  /** Rate is per Sq.ft for area items or per Cu.ft for volume items, in the project currency. */
  ratePerSqft: number;
  ratePerCuft: number;
  /** Panel thickness used when breaking a box/drawer into cut panels, in mm. */
  thicknessMm: number;
  /** Free-text spec shown on the client proposal, e.g. grade, brand, finish, ISI mark. */
  spec: string;
}

export interface ComponentRow {
  id: string;
  sno: number;
  room: string;
  description: string;
  kind: ComponentKind;
  widthFt: number | null;
  heightFt: number | null;
  /** Blank/0 depth => area calc (frame/shutter). Present depth => volume calc. */
  depthFt: number | null;
  wall: Wall;
  materialId: string;
  /** Rate per Sq.ft or Cu.ft depending on calc basis, editable override of the material default. */
  rate: number;
  qty: number;
  /** Manual override of the computed amount, mirrors the Excel "type your own" behaviour. */
  amountOverride: number | null;
  remarks: string;
}

export interface Room {
  id: string;
  name: string;
  components: ComponentRow[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  siteName: string;
  quotationNo: string;
  date: string;
  projectType: ProjectType;
  gstPercent: number;
  materials: Material[];
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface ComputedRow extends ComponentRow {
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  calcBasis: CalcBasis | null;
  areaOrVolume: number | null;
  amount: number;
}

export interface CutPanel {
  id: string;
  room: string;
  wall: Wall;
  componentDescription: string;
  panelName: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  materialName: string;
  qty: number;
}

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  materialSpec: string;
  areaSqft: number;
  volumeCuft: number;
  amount: number;
}

export interface ProjectTotals {
  totalAreaSqft: number;
  totalVolumeCuft: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  materialUsage: MaterialUsage[];
  roomSubtotals: { room: string; amount: number }[];
}

export const WALL_LABELS: Record<Wall, string> = {
  front: "Front Wall",
  left: "Left Wall",
  right: "Right Wall",
  back: "Back Wall",
  unassigned: "Unassigned",
};

export const COMPONENT_KIND_LABELS: Record<ComponentKind, string> = {
  shutter: "Shutter / Frame",
  box: "Cabinet Box",
  drawer: "Drawer",
  panel: "Panel",
  other: "Other",
};
