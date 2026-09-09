export type ProjectType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Office' | 'Shop' | 'Custom';

export type RoomType =
  | 'Living Room'
  | 'Kitchen'
  | 'Master Bedroom'
  | 'Bedroom 2'
  | 'Bedroom 3'
  | 'Dining'
  | 'Pooja'
  | 'Utility'
  | 'Office'
  | 'Custom'
  | 'Custom Room';

export type CadTool =
  | 'SELECT'
  | 'PAN'
  | 'MOVE'
  | 'COPY'
  | 'ROTATE'
  | 'MIRROR'
  | 'MIRROR_H'
  | 'MIRROR_V'
  | 'DELETE'
  | 'WALL'
  | 'DOOR'
  | 'WINDOW'
  | 'COLUMN'
  | 'LINE'
  | 'RECTANGLE'
  | 'ARC'
  | 'OFFSET'
  | 'MEASURE'
  | 'DIMENSION'
  | 'AUTO_DIMENSION'
  | 'TEXT'
  | 'SECTION_TOOL'
  | 'PLACE_FURNITURE';

export type CadViewMode =
  | '2D_PLAN'
  | 'ELEVATION'
  | 'SECTION'
  | '3D_VIEW'
  | 'CUTTING_LIST';

export type ViewMode = CadViewMode | 'FRONT_ELEVATION' | 'SIDE_ELEVATION' | 'SECTION_AA' | '3D_PERSPECTIVE' | 'QUOTATION';

export type FurnitureCategory =
  | 'kitchen'
  | 'below_overhead'
  | 'wardrobe'
  | 'sitting'
  | 'vertical_box'
  | 'tv_unit'
  | 'bed'
  | 'living'
  | 'office'
  | 'pooja'
  | 'utility'
  | 'other';

export interface MaterialOption {
  id: string;
  name: string;
  category: 'carcass' | 'shutter' | 'countertop' | 'glass';
  colorHex: string;
  roughness: number;
  metalness: number;
  texturePattern?: 'wood' | 'gloss' | 'matte' | 'quartz' | 'marble' | 'fluted';
  costPerSqFt: number;
}

export interface InternalSectionConfig {
  id: string;
  type: 'hanging_long' | 'hanging_short' | 'shelves' | 'drawers' | 'shoe_rack' | 'open_niche';
  widthRatio: number; // 0 to 1 proportion
  shelfCount?: number;
  drawerCount?: number;
}

export interface ParametricDetails {
  carcassThickness: number; // e.g. 18mm
  backPlyThickness: number; // e.g. 9mm
  shutterCount: number; // e.g. 2, 3, 4
  shutterType: 'hinged' | 'sliding' | 'open' | 'liftup' | 'glass' | 'fluted';
  shutterFinish: string;
  shutterColor: string;
  handleType: 'g_profile' | 'edge_lip' | 'bar' | 'push_to_open' | 'concealed';
  drawerCount: number;
  shelfCount: number;
  hasLoft: boolean;
  loftHeight: number;
  hasCountertop: boolean;
  countertopThickness: number;
  countertopOverhang: number;
  countertopMaterial: string;
  skirtingHeight: number; // e.g. 75mm or 100mm
  targetVerticalBoxHeight?: number; // User-defined target vertical box clear height (e.g. 350mm)
  verticalBoxMode?: 'equal_boxes' | 'fixed_master_box';
  fixedBoxHeight?: number; // Primary master box height (e.g. 450mm bottom box)
  fixedBoxPosition?: 'bottom' | 'top';
  autoAdjustShelves?: boolean; // When true, auto-recalculates shelves when cabinet height changes
  internalSections?: InternalSectionConfig[];
  hingesCount?: number;
  slidePairs?: number;
  handlesCount?: number;
  legsCount?: number;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  category: FurnitureCategory;
  name: string;
  description?: string;
  x: number; // mm in 2D coordinate system
  y: number; // mm in 2D coordinate system
  z: number; // Elevation from finished floor level (FFL) in mm
  width: number; // mm (X-dimension in local orientation)
  height: number; // mm (Z-dimension)
  depth: number; // mm (Y-dimension in local orientation)
  rotation: number; // Degrees (0, 90, 180, 270 or arbitrary)
  parametric: ParametricDetails;
  materials: {
    carcassMaterial: string;
    carcassFinish: string;
    shutterMaterial: string;
    shutterFinish: string;
    shutterColor: string;
    counterMaterial?: string;
  };
  pinnedToWallId?: string;
  isCustom?: boolean;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number; // 100, 150, 230mm
  height: number; // standard 2900mm
  color?: string;
}

export interface Door {
  id: string;
  wallId?: string;
  x: number;
  y: number;
  width: number; // 750, 900, 1050, 1200mm
  height: number; // 2100mm
  wallSide: 'top' | 'bottom' | 'left' | 'right' | 'custom';
  rotation: number;
  swing: 'inward_left' | 'inward_right' | 'outward_left' | 'outward_right' | 'sliding';
}

export interface Window {
  id: string;
  wallId?: string;
  x: number;
  y: number;
  width: number; // 900, 1200, 1500, 1800, 2400mm
  height: number; // 1200mm
  sillHeight: number; // 900mm from floor
  wallSide: 'top' | 'bottom' | 'left' | 'right' | 'custom';
  rotation: number;
  type: 'sliding' | 'casement' | 'fixed';
}

export interface Column {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
}

export interface CadDimension {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offset: number;
  textOverride?: string;
  type: 'linear' | 'aligned';
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color?: string;
}

export interface SectionCut {
  id: string;
  label: string; // 'A-A', 'B-B'
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  viewDirection: 'up' | 'down' | 'left' | 'right';
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  columns: Column[];
  furniture: FurnitureItem[];
  dimensions: CadDimension[];
  textAnnotations: TextAnnotation[];
  sectionCuts: SectionCut[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  customerName: string;
  siteAddress: string;
  projectType: ProjectType;
  unitSystem: 'mm' | 'inch_ft';
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  activeRoomId: string;
  selectedFurnitureId: string | null;
  selectedWallId: string | null;
  selectedDoorId: string | null;
  selectedWindowId: string | null;
  selectedColumnId?: string | null;
  selectedTextId?: string | null;
}

export interface CuttingItem {
  id: string;
  partName: string;
  parentFurnitureId: string;
  parentFurnitureName: string;
  category: FurnitureCategory;
  qty: number;
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
  material: string;
  finish: string;
  color: string;
  edgeBandingSides: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
  edgeBandingThickness: number; // 0.8mm or 2mm
  grainDirection: 'length' | 'width' | 'none';
  remarks?: string;
}

export interface CatalogFurnitureTemplate {
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultDepth: number;
  defaultZ: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
  defaultParametric: ParametricDetails;
  thumbnailIcon: string;
}
