import * as XLSX from 'xlsx';
import { ProjectInfo, Room, FurnitureItem, Wall, Door, Window, Column, CadDimension, TextAnnotation, SectionCut, RoomType, FurnitureCategory } from '../types/cad';
import { calculateRoomArea } from './areaCalculations';

export interface ParsedRoomRow {
  rowNumber: number;
  roomName: string;
  roomType: RoomType;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  wallThicknessMm: number;
  ceilingHeightMm?: number;
  notes?: string;
}

export interface ParsedFurnitureRow {
  roomName: string;
  roomIndex?: number;
  category: FurnitureCategory;
  name: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  elevationZMm?: number;
  wallPlacement?: 'back_wall' | 'left_wall' | 'right_wall' | 'front_wall' | 'center' | 'auto';
  xMm?: number;
  yMm?: number;
  rotationDeg?: number;
  carcassMaterial?: string;
  carcassFinish?: string;
  shutterMaterial?: string;
  shutterFinish?: string;
  shutterColor?: string;
  shutterCount?: number;
  shelfCount?: number;
  drawerCount?: number;
  hasLoft?: boolean;
  loftHeightMm?: number;
  hasCountertop?: boolean;
  countertopMaterial?: string;
  countertopThicknessMm?: number;
  skirtingHeightMm?: number;
}

export interface ParsedOpeningRow {
  roomName: string;
  roomIndex?: number;
  type: 'Door' | 'Window';
  wallSide: 'top' | 'bottom' | 'left' | 'right';
  widthMm: number;
  heightMm: number;
  sillHeightMm?: number;
  offsetMm?: number; // Distance from wall start corner
  swingOrType?: string; // 'inward_right', 'inward_left', 'sliding', 'casement'
}

export interface ExcelParseResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  projectName: string;
  projectType: string;
  customerName?: string;
  siteAddress?: string;
  parsedRooms: ParsedRoomRow[];
  parsedFurniture: ParsedFurnitureRow[];
  parsedOpenings: ParsedOpeningRow[];
  generatedProject?: ProjectInfo;
}

/**
 * Universal length parser that accepts:
 * - Pure numbers (assumed mm unless specified)
 * - Strings like: "3600", "3600mm", "12ft", "12'", "12'6\"", "12 ft 6 in", "3.65m", "365cm"
 */
export function parseExcelDimension(val: any, fallbackMm: number = 3000): number {
  if (val === undefined || val === null || val === '') return fallbackMm;
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return fallbackMm;
    // If a very small number like 12 or 10, check if user wrote feet
    if (val < 40) {
      // If someone writes 12 in a dimension column, it's almost certainly 12 feet (3658 mm)
      return Math.round(val * 304.8);
    }
    return Math.round(val);
  }

  const str = String(val).trim().toLowerCase();
  if (!str) return fallbackMm;

  // 1. Check Feet & Inches: e.g. 12'6", 12' 6", 12ft 6in, 12ft, 10'
  const ftInRegex = /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/i;
  const ftInMatch = str.match(ftInRegex);
  if (ftInMatch) {
    const feet = parseFloat(ftInMatch[1]) || 0;
    const inches = parseFloat(ftInMatch[2]) || 0;
    const totalMm = Math.round(feet * 304.8 + inches * 25.4);
    return totalMm > 0 ? totalMm : fallbackMm;
  }

  // 2. Check Inches only: e.g. 72" or 72in
  const inRegex = /^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/i;
  const inMatch = str.match(inRegex);
  if (inMatch) {
    const inches = parseFloat(inMatch[1]) || 0;
    return Math.round(inches * 25.4);
  }

  // 3. Check Meters: e.g. 3.65m or 3.65 m
  const mRegex = /^(\d+(?:\.\d+)?)\s*m(?:eters?)?$/i;
  const mMatch = str.match(mRegex);
  if (mMatch) {
    const meters = parseFloat(mMatch[1]) || 0;
    return Math.round(meters * 1000);
  }

  // 4. Check Centimeters: e.g. 365cm
  const cmRegex = /^(\d+(?:\.\d+)?)\s*cm$/i;
  const cmMatch = str.match(cmRegex);
  if (cmMatch) {
    const cm = parseFloat(cmMatch[1]) || 0;
    return Math.round(cm * 10);
  }

  // 5. Check Millimeters: e.g. 3600mm
  const mmRegex = /^(\d+(?:\.\d+)?)\s*(?:mm)?$/i;
  const mmMatch = str.match(mmRegex);
  if (mmMatch) {
    const num = parseFloat(mmMatch[1]) || 0;
    if (num < 40) {
      // Under 40 without units is likely feet
      return Math.round(num * 304.8);
    }
    return Math.round(num);
  }

  // Default fallback if numbers extracted
  const numericOnly = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(numericOnly) && numericOnly > 0) {
    return numericOnly < 40 ? Math.round(numericOnly * 304.8) : Math.round(numericOnly);
  }

  return fallbackMm;
}

/**
 * Normalizes Room Type string from Excel
 */
export function normalizeRoomType(raw: string): RoomType {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('master') && s.includes('bed')) return 'Master Bedroom';
  if (s.includes('bed') && (s.includes('2') || s.includes('kids') || s.includes('child'))) return 'Bedroom 2';
  if (s.includes('bed') && (s.includes('3') || s.includes('guest'))) return 'Bedroom 3';
  if (s.includes('bed')) return 'Master Bedroom';
  if (s.includes('kitchen')) return 'Kitchen';
  if (s.includes('living')) return 'Living Room';
  if (s.includes('dining')) return 'Dining';
  if (s.includes('pooja') || s.includes('mandir') || s.includes('temple')) return 'Pooja';
  if (s.includes('utility') || s.includes('balcony') || s.includes('wash')) return 'Utility';
  if (s.includes('office') || s.includes('study')) return 'Office';
  return 'Custom';
}

/**
 * Normalizes Furniture Category string from Excel
 */
export function normalizeFurnitureCategory(raw: string, itemName: string = ''): FurnitureCategory {
  const s = `${raw || ''} ${itemName || ''}`.toLowerCase();
  if (s.includes('wardrobe') || s.includes('cupboard') || s.includes('closet') || s.includes('almirah')) return 'wardrobe';
  if (s.includes('kitchen') || s.includes('base') || s.includes('sink') || s.includes('hob') || s.includes('pantry')) return 'kitchen';
  if (s.includes('overhead') || s.includes('wall unit') || s.includes('crockery')) return 'below_overhead';
  if (s.includes('tv') || s.includes('entertainment') || s.includes('media')) return 'tv_unit';
  if (s.includes('bed') || s.includes('headboard') || s.includes('mattress') || s.includes('cot')) return 'bed';
  if (s.includes('sofa') || s.includes('couch') || s.includes('chair') || s.includes('seating')) return 'sitting';
  if (s.includes('shelf') || s.includes('bookcase') || s.includes('cabinet') || s.includes('tall')) return 'vertical_box';
  if (s.includes('office') || s.includes('desk') || s.includes('study')) return 'office';
  if (s.includes('pooja') || s.includes('mandir')) return 'pooja';
  if (s.includes('utility') || s.includes('shoe')) return 'utility';
  if (s.includes('dining') || s.includes('table')) return 'living';
  return 'other';
}

/**
 * Parses an Excel file ArrayBuffer and generates a complete CAD Project with all rooms and layouts.
 */
export function parseExcelWorkbookToProject(data: ArrayBuffer | Uint8Array): ExcelParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array' });
  } catch (err: any) {
    return {
      success: false,
      errors: [`Failed to read Excel file: ${err?.message || 'Invalid format'}`],
      warnings: [],
      projectName: 'Imported Project',
      projectType: '3BHK',
      parsedRooms: [],
      parsedFurniture: [],
      parsedOpenings: [],
    };
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      success: false,
      errors: ['The uploaded Excel workbook contains no sheets.'],
      warnings: [],
      projectName: 'Imported Project',
      projectType: '3BHK',
      parsedRooms: [],
      parsedFurniture: [],
      parsedOpenings: [],
    };
  }

  let projectName = 'Excel Imported Interior Project';
  let customerName = 'Client';
  let siteAddress = 'Project Site';
  let projectType: any = '3BHK';

  const parsedRooms: ParsedRoomRow[] = [];
  const parsedFurniture: ParsedFurnitureRow[] = [];
  const parsedOpenings: ParsedOpeningRow[] = [];

  // Helper to find sheet by name substring (case-insensitive)
  const findSheet = (keywords: string[]) => {
    const sheetName = workbook.SheetNames.find((name) =>
      keywords.some((kw) => name.toLowerCase().includes(kw))
    );
    return sheetName ? workbook.Sheets[sheetName] : null;
  };

  // Case A: Check for structured multi-sheets
  const roomsSheet = findSheet(['room', 'dimension', 'space', 'plan']);
  const furnitureSheet = findSheet(['furniture', 'cabinet', 'module', 'wardrobe', 'kitchen', 'item']);
  const openingsSheet = findSheet(['door', 'window', 'opening']);

  // Helper to ensure unique room names across rows
  const roomNameCounts = new Map<string, number>();
  const getUniqueRoomName = (rawName: string): string => {
    const baseName = (rawName || 'Room').trim();
    const count = (roomNameCounts.get(baseName.toLowerCase()) || 0) + 1;
    roomNameCounts.set(baseName.toLowerCase(), count);
    if (count > 1) {
      return `${baseName} ${count}`;
    }
    return baseName;
  };

  // If specific rooms sheet exists, parse each row as a unique room instance
  if (roomsSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(roomsSheet, { defval: '' });
    rows.forEach((row, idx) => {
      // Find room name & dimensions by flexible key matching
      const rawName = row['Room Name'] || row['Room'] || row['Name'] || row['Space'] || row['Room / Space'] || row['Area'] || row['Particulars'];
      const rTypeRaw = row['Room Type'] || row['Type'] || rawName || 'Custom';
      const widthVal = row['Width'] || row['Width (mm)'] || row['Width (ft)'] || row['Width (in)'] || row['Room Width'] || row['Length'] || row['W'] || row['L'] || row['X'] || 3658;
      const depthVal = row['Depth'] || row['Depth (mm)'] || row['Depth (ft)'] || row['Depth (in)'] || row['Room Depth'] || row['Breadth'] || row['D'] || row['B'] || row['Y'] || 3048;
      const heightVal = row['Height'] || row['Height (mm)'] || row['Ceiling Height'] || row['Room Height'] || row['Clear Height'] || row['H'] || 2900;
      const wallThickVal = row['Wall Thickness'] || row['Wall Thickness (mm)'] || row['Wall'] || row['Wall Thk'] || 150;
      const notes = row['Notes'] || row['Remarks'] || row['Description'] || '';

      // Check if row has valid content
      if (rawName || widthVal || depthVal) {
        const uniqueName = getUniqueRoomName(String(rawName || `Room ${idx + 1}`));
        parsedRooms.push({
          rowNumber: idx + 1,
          roomName: uniqueName,
          roomType: normalizeRoomType(String(rTypeRaw)),
          widthMm: parseExcelDimension(widthVal, 3658),
          depthMm: parseExcelDimension(depthVal, 3048),
          heightMm: parseExcelDimension(heightVal, 2900),
          wallThicknessMm: parseExcelDimension(wallThickVal, 150),
          notes: notes ? String(notes).trim() : undefined,
        });
      }
    });
  }

  // Parse Furniture Sheet if present
  if (furnitureSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(furnitureSheet, { defval: '' });
    rows.forEach((row, idx) => {
      const roomTarget = row['Room Name'] || row['Room'] || row['Space'] || row['Room / Space'] || (parsedRooms[0] ? parsedRooms[0].roomName : 'Living Room');
      const itemName = row['Item Name'] || row['Furniture Name'] || row['Name'] || row['Module'] || row['Item'] || `Module ${idx + 1}`;
      const categoryRaw = row['Category'] || row['Type'] || row['Module Type'] || '';
      const widthVal = row['Width'] || row['Width (mm)'] || row['Item Width'] || row['W'] || 1200;
      const depthVal = row['Depth'] || row['Depth (mm)'] || row['Item Depth'] || row['D'] || 600;
      const heightVal = row['Height'] || row['Height (mm)'] || row['Item Height'] || row['H'] || 2100;
      const zVal = row['Z Elevation'] || row['Elevation (mm)'] || row['Z (mm)'] || row['Z'] || 0;
      const wallSide = row['Wall Placement'] || row['Wall Side'] || row['Wall'] || 'auto';
      const xVal = row['X Position'] || row['X (mm)'] || row['X'];
      const yVal = row['Y Position'] || row['Y (mm)'] || row['Y'];
      const rotVal = row['Rotation'] || row['Rotation (deg)'] || row['Angle'] || 0;

      const shuttersVal = row['Shutters'] || row['Shutter Count'] || row['No of Shutters'];
      const shelvesVal = row['Shelves'] || row['Shelf Count'] || row['No of Shelves'];
      const drawersVal = row['Drawers'] || row['Drawer Count'] || row['No of Drawers'];
      const hasLoftVal = row['Has Loft'] || row['Loft (Yes/No)'] || row['Loft'];
      const loftHeightVal = row['Loft Height'] || row['Loft Height (mm)'] || 600;
      const hasCounterVal = row['Has Countertop'] || row['Countertop'];
      const counterMatVal = row['Countertop Material'] || row['Counter Material'];

      if (itemName && String(itemName).trim()) {
        parsedFurniture.push({
          roomName: String(roomTarget).trim(),
          category: normalizeFurnitureCategory(String(categoryRaw), String(itemName)),
          name: String(itemName).trim(),
          widthMm: parseExcelDimension(widthVal, 1200),
          depthMm: parseExcelDimension(depthVal, 600),
          heightMm: parseExcelDimension(heightVal, 2100),
          elevationZMm: zVal !== '' && zVal !== undefined ? parseExcelDimension(zVal, 0) : 0,
          wallPlacement: String(wallSide).toLowerCase().trim() as any,
          xMm: xVal !== '' && xVal !== undefined ? parseExcelDimension(xVal, 0) : undefined,
          yMm: yVal !== '' && yVal !== undefined ? parseExcelDimension(yVal, 0) : undefined,
          rotationDeg: typeof rotVal === 'number' ? rotVal : parseInt(rotVal) || 0,
          carcassMaterial: row['Carcass Material'] || '18mm BWP Plywood',
          carcassFinish: row['Carcass Finish'] || 'Frosty White',
          shutterMaterial: row['Shutter Material'] || '18mm HDHMR',
          shutterFinish: row['Shutter Finish'] || 'Acrylic High Gloss',
          shutterColor: row['Shutter Color'] || '#FAFAFA',
          shutterCount: shuttersVal !== '' && shuttersVal !== undefined ? parseInt(shuttersVal) : undefined,
          shelfCount: shelvesVal !== '' && shelvesVal !== undefined ? parseInt(shelvesVal) : undefined,
          drawerCount: drawersVal !== '' && drawersVal !== undefined ? parseInt(drawersVal) : undefined,
          hasLoft: String(hasLoftVal).toLowerCase().includes('y') || String(hasLoftVal) === '1' || String(hasLoftVal).toLowerCase().includes('true'),
          loftHeightMm: parseExcelDimension(loftHeightVal, 600),
          hasCountertop: String(hasCounterVal).toLowerCase().includes('y') || String(hasCounterVal) === '1' || String(hasCounterVal).toLowerCase().includes('true'),
          countertopMaterial: counterMatVal ? String(counterMatVal) : undefined,
          countertopThicknessMm: parseExcelDimension(row['Countertop Thickness'] || 20, 20),
          skirtingHeightMm: parseExcelDimension(row['Skirting Height'] || 75, 75),
        });
      }
    });
  }

  // Parse Openings Sheet if present
  if (openingsSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(openingsSheet, { defval: '' });
    rows.forEach((row) => {
      const roomTarget = row['Room Name'] || row['Room'] || row['Space'] || row['Room / Space'] || (parsedRooms[0] ? parsedRooms[0].roomName : 'Living Room');
      const typeRaw = row['Type'] || row['Opening Type'] || 'Door';
      const wallSide = (row['Wall Side'] || row['Wall'] || 'bottom').toLowerCase().trim();
      const widthVal = row['Width'] || row['Width (mm)'] || 900;
      const heightVal = row['Height'] || row['Height (mm)'] || 2100;
      const sillVal = row['Sill Height'] || row['Sill (mm)'] || 900;
      const offsetVal = row['Offset'] || row['Position (mm)'] || row['X/Y'];

      parsedOpenings.push({
        roomName: String(roomTarget).trim(),
        type: String(typeRaw).toLowerCase().includes('win') ? 'Window' : 'Door',
        wallSide: (['top', 'bottom', 'left', 'right'].includes(wallSide) ? wallSide : 'bottom') as any,
        widthMm: parseExcelDimension(widthVal, 900),
        heightMm: parseExcelDimension(heightVal, 2100),
        sillHeightMm: parseExcelDimension(sillVal, 900),
        offsetMm: offsetVal !== '' && offsetVal !== undefined ? parseExcelDimension(offsetVal, 500) : undefined,
        swingOrType: row['Swing'] || row['Subtype'] || (String(typeRaw).toLowerCase().includes('win') ? 'sliding' : 'inward_right'),
      });
    });
  }

  // Case B: If no multi-sheets found or only 1 generic sheet, parse rows universally where EVERY ROW maps to a room instance!
  if (parsedRooms.length === 0) {
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '' });

    rows.forEach((row, idx) => {
      // Find room name & dimensions
      const rawName = row['Room Name'] || row['Room'] || row['Space'] || row['Room / Space'] || row['Name'] || row['Area Name'] || row['Particulars'] || row['Description'];
      const elemType = String(row['Element Type'] || row['Row Type'] || row['Type'] || row['Category'] || '').toLowerCase();
      const widthVal = row['Room Width'] || row['Width'] || row['Width (mm)'] || row['Width (ft)'] || row['Width (in)'] || row['Length'] || row['W'] || row['L'] || row['X'];
      const depthVal = row['Room Depth'] || row['Depth'] || row['Depth (mm)'] || row['Depth (ft)'] || row['Depth (in)'] || row['Breadth'] || row['D'] || row['B'] || row['Y'];
      const heightVal = row['Room Height'] || row['Height'] || row['Height (mm)'] || row['Ceiling Height'] || row['H'] || 2900;
      const wallThickVal = row['Wall Thickness'] || row['Wall Thickness (mm)'] || row['Wall'] || row['Thk'] || 150;
      const notes = row['Notes'] || row['Remarks'] || row['Description'] || '';

      // As long as there is a name or dimensions on this row, treat this row as a unique room instance!
      if (rawName || widthVal || depthVal) {
        const uniqueName = getUniqueRoomName(String(rawName || `Room ${idx + 1}`));
        const parsedRoom: ParsedRoomRow = {
          rowNumber: idx + 1,
          roomName: uniqueName,
          roomType: normalizeRoomType(String(row['Room Type'] || elemType || uniqueName)),
          widthMm: parseExcelDimension(widthVal || 3658, 3658),
          depthMm: parseExcelDimension(depthVal || 3048, 3048),
          heightMm: parseExcelDimension(heightVal, 2900),
          wallThicknessMm: parseExcelDimension(wallThickVal, 150),
          notes: notes ? String(notes).trim() : undefined,
        };
        parsedRooms.push(parsedRoom);

        // If this same row also includes inline furniture columns (e.g. Wardrobe, Modular Kitchen, Bed)
        const itemName = row['Furniture Item'] || row['Item Name'] || row['Module Name'] || row['Cabinet'] || row['Furniture'] || (elemType.includes('furniture') || elemType.includes('wardrobe') || elemType.includes('kitchen') ? row['Name'] : null);
        if (itemName && String(itemName).trim()) {
          const furnWidth = row['Item Width'] || row['Furniture Width'] || (parsedRoom.widthMm > 2000 ? 1800 : 1200);
          const furnDepth = row['Item Depth'] || row['Furniture Depth'] || 600;
          const furnHeight = row['Item Height'] || row['Furniture Height'] || 2100;
          parsedFurniture.push({
            roomName: uniqueName,
            category: normalizeFurnitureCategory(String(row['Category'] || elemType), String(itemName)),
            name: String(itemName).trim(),
            widthMm: parseExcelDimension(furnWidth, 1200),
            depthMm: parseExcelDimension(furnDepth, 600),
            heightMm: parseExcelDimension(furnHeight, 2100),
            wallPlacement: (row['Wall Placement'] || row['Wall Side'] || 'auto') as any,
            xMm: row['X'] !== '' && row['X'] !== undefined ? parseExcelDimension(row['X'], 0) : undefined,
            yMm: row['Y'] !== '' && row['Y'] !== undefined ? parseExcelDimension(row['Y'], 0) : undefined,
            shutterCount: row['Shutters'] ? parseInt(row['Shutters']) : undefined,
            shelfCount: row['Shelves'] ? parseInt(row['Shelves']) : undefined,
            drawerCount: row['Drawers'] ? parseInt(row['Drawers']) : undefined,
            hasLoft: String(row['Has Loft'] || row['Loft'] || '').toLowerCase().includes('y'),
            hasCountertop: String(row['Has Countertop'] || row['Countertop'] || '').toLowerCase().includes('y'),
            countertopMaterial: row['Countertop Material'] || undefined,
          });
        }

        // If row specifies Door or Window columns
        if (row['Door Width'] || row['Door'] || elemType.includes('door')) {
          parsedOpenings.push({
            roomName: uniqueName,
            type: 'Door',
            wallSide: (['top', 'bottom', 'left', 'right'].includes(String(row['Door Wall'] || row['Wall Side']).toLowerCase()) ? String(row['Door Wall'] || row['Wall Side']).toLowerCase() : 'bottom') as any,
            widthMm: parseExcelDimension(row['Door Width'] || 900, 900),
            heightMm: parseExcelDimension(row['Door Height'] || 2100, 2100),
            swingOrType: row['Door Swing'] || 'inward_right',
          });
        }
        if (row['Window Width'] || row['Window'] || elemType.includes('window')) {
          parsedOpenings.push({
            roomName: uniqueName,
            type: 'Window',
            wallSide: (['top', 'bottom', 'left', 'right'].includes(String(row['Window Wall'] || row['Wall Side']).toLowerCase()) ? String(row['Window Wall'] || row['Wall Side']).toLowerCase() : 'top') as any,
            widthMm: parseExcelDimension(row['Window Width'] || 1200, 1200),
            heightMm: parseExcelDimension(row['Window Height'] || 1200, 1200),
            sillHeightMm: parseExcelDimension(row['Window Sill'] || 900, 900),
            swingOrType: row['Window Type'] || 'sliding',
          });
        }
      }
    });
  }

  // If still no rooms detected, generate a fallback default room with user's table values
  if (parsedRooms.length === 0) {
    warnings.push('No explicit "Room Name" or "Width/Depth" columns found. Created a default Master Suite room.');
    parsedRooms.push({
      rowNumber: 1,
      roomName: 'Master Bedroom',
      roomType: 'Master Bedroom',
      widthMm: 3962,
      depthMm: 3658,
      heightMm: 2900,
      wallThicknessMm: 150,
    });
  }

  // Determine Project Type based on detected room types & count
  if (parsedRooms.length >= 4) projectType = '3BHK';
  else if (parsedRooms.length === 3) projectType = '2BHK';
  else if (parsedRooms.length === 2) projectType = '1BHK';
  else if (parsedRooms.length === 1 && parsedRooms[0].roomType === 'Office') projectType = 'Office';
  else projectType = 'Custom';

  // Build Full CAD Rooms with Walls, Doors, Windows, Auto-Dimensions, Watermarks & Parametric Furniture Layouts!
  const generatedRooms: Room[] = parsedRooms.map((roomRow, roomIdx) => {
    const { roomName, roomType, widthMm, depthMm, heightMm, wallThicknessMm } = roomRow;
    const roomId = `room_xl_${Date.now()}_${roomIdx}`;

    // 1. Generate 4 Enclosing Structural Walls
    const walls: Wall[] = [
      { id: `w1_${roomIdx}`, x1: 0, y1: 0, x2: widthMm, y2: 0, thickness: wallThicknessMm, height: heightMm },
      { id: `w2_${roomIdx}`, x1: widthMm, y1: 0, x2: widthMm, y2: depthMm, thickness: wallThicknessMm, height: heightMm },
      { id: `w3_${roomIdx}`, x1: widthMm, y1: depthMm, x2: 0, y2: depthMm, thickness: wallThicknessMm, height: heightMm },
      { id: `w4_${roomIdx}`, x1: 0, y1: depthMm, x2: 0, y2: 0, thickness: wallThicknessMm, height: heightMm },
    ];

    // 2. Openings (Doors & Windows) for this room
    const roomOpenings = parsedOpenings.filter((o) => o.roomName.toLowerCase() === roomName.toLowerCase());
    const doors: Door[] = [];
    const windows: Window[] = [];

    if (roomOpenings.length > 0) {
      roomOpenings.forEach((op, opIdx) => {
        const isDoor = op.type === 'Door';
        let x = 0;
        let y = 0;
        let rot = 0;

        if (op.wallSide === 'top') {
          x = op.offsetMm !== undefined ? op.offsetMm : widthMm / 2 - op.widthMm / 2;
          y = 0;
          rot = 0;
        } else if (op.wallSide === 'bottom') {
          x = op.offsetMm !== undefined ? op.offsetMm : widthMm - op.widthMm - 600;
          y = depthMm;
          rot = 180;
        } else if (op.wallSide === 'left') {
          x = 0;
          y = op.offsetMm !== undefined ? op.offsetMm : depthMm / 2 - op.widthMm / 2;
          rot = 270;
        } else if (op.wallSide === 'right') {
          x = widthMm;
          y = op.offsetMm !== undefined ? op.offsetMm : depthMm / 2 - op.widthMm / 2;
          rot = 90;
        }

        if (isDoor) {
          doors.push({
            id: `d_xl_${roomIdx}_${opIdx}`,
            x: Math.max(100, Math.min(widthMm - op.widthMm, x)),
            y: Math.max(0, Math.min(depthMm, y)),
            width: op.widthMm,
            height: op.heightMm,
            wallSide: op.wallSide,
            rotation: rot,
            swing: (op.swingOrType as any) || 'inward_right',
          });
        } else {
          windows.push({
            id: `win_xl_${roomIdx}_${opIdx}`,
            x: Math.max(100, Math.min(widthMm - op.widthMm, x)),
            y: Math.max(0, Math.min(depthMm, y)),
            width: op.widthMm,
            height: op.heightMm,
            sillHeight: op.sillHeightMm || 900,
            wallSide: op.wallSide,
            rotation: rot,
            type: (op.swingOrType as any) || 'sliding',
          });
        }
      });
    } else {
      // Default architectural door & window if none in excel
      doors.push({
        id: `d_def_${roomIdx}`,
        x: Math.max(100, widthMm - 1100),
        y: depthMm,
        width: 900,
        height: 2100,
        wallSide: 'bottom',
        rotation: 0,
        swing: 'inward_right',
      });

      windows.push({
        id: `win_def_${roomIdx}`,
        x: Math.max(200, Math.round(widthMm / 2 - 600)),
        y: 0,
        width: 1200,
        height: 1200,
        sillHeight: 900,
        wallSide: 'top',
        rotation: 0,
        type: 'sliding',
      });
    }

    // 3. Furniture Layout Generation
    const roomFurnItems = parsedFurniture.filter((f) => f.roomName.toLowerCase() === roomName.toLowerCase());
    const furniture: FurnitureItem[] = [];

    if (roomFurnItems.length > 0) {
      // Place items specified in Excel
      let currentBackWallX = 100;
      let currentLeftWallY = 100;
      let currentRightWallY = 100;

      roomFurnItems.forEach((fItem, fIdx) => {
        let x = fItem.xMm;
        let y = fItem.yMm;
        let rot = fItem.rotationDeg || 0;
        const w = fItem.widthMm;
        const d = fItem.depthMm;
        const h = fItem.heightMm;
        const z = fItem.elevationZMm || 0;

        // Auto-calculate position if X/Y not provided
        if (x === undefined || y === undefined) {
          const placement = fItem.wallPlacement || 'auto';

          if (placement === 'left_wall' || (placement === 'auto' && (fItem.category === 'wardrobe' || fItem.name.toLowerCase().includes('wardrobe')))) {
            x = 80;
            y = currentLeftWallY;
            rot = 90;
            currentLeftWallY += w + 50;
          } else if (placement === 'right_wall') {
            x = widthMm - d - 80;
            y = currentRightWallY;
            rot = 270;
            currentRightWallY += w + 50;
          } else if (placement === 'center' || fItem.category === 'bed') {
            x = Math.max(100, Math.round(widthMm / 2 - w / 2));
            y = 100; // headboard on top wall
            rot = 0;
          } else if (placement === 'front_wall' || fItem.category === 'tv_unit') {
            x = Math.max(100, Math.round(widthMm / 2 - w / 2));
            y = Math.max(100, depthMm - d - 100);
            rot = 180;
          } else {
            // Default top back wall placement
            x = currentBackWallX;
            y = 80;
            rot = 0;
            currentBackWallX += w + 50;
          }
        }

        // Clamp to room interior boundaries
        x = Math.max(50, Math.min(widthMm - 200, x || 100));
        y = Math.max(50, Math.min(depthMm - 200, y || 100));

        // Derive parametric shutter/drawer/shelf counts
        const calculatedShutters = fItem.shutterCount !== undefined
          ? fItem.shutterCount
          : w >= 2000 ? 4 : w >= 1350 ? 3 : w >= 800 ? 2 : 1;
        const calculatedShelves = fItem.shelfCount !== undefined
          ? fItem.shelfCount
          : h >= 2000 ? 4 : h >= 1200 ? 2 : 1;
        const calculatedDrawers = fItem.drawerCount !== undefined
          ? fItem.drawerCount
          : fItem.category === 'wardrobe' ? 2 : fItem.category === 'tv_unit' ? 2 : 0;

        furniture.push({
          id: `furn_xl_${roomIdx}_${fIdx}`,
          catalogId: `cat_${fItem.category}_${fIdx}`,
          category: fItem.category,
          name: fItem.name,
          x,
          y,
          z,
          width: w,
          height: h,
          depth: d,
          rotation: rot,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: calculatedShutters,
            shutterType: 'hinged',
            shutterFinish: fItem.shutterFinish || 'Acrylic High Gloss',
            shutterColor: fItem.shutterColor || '#FAFAFA',
            handleType: 'edge_lip',
            drawerCount: calculatedDrawers,
            shelfCount: calculatedShelves,
            hasLoft: fItem.hasLoft || false,
            loftHeight: fItem.loftHeightMm || 600,
            hasCountertop: fItem.hasCountertop || false,
            countertopThickness: fItem.countertopThicknessMm || 20,
            countertopOverhang: 25,
            countertopMaterial: fItem.countertopMaterial || 'Quartz Calacatta Gold',
            skirtingHeight: fItem.skirtingHeightMm || 75,
            hingesCount: calculatedShutters * (h > 2100 ? 4 : 3),
            slidePairs: calculatedDrawers,
            handlesCount: calculatedShutters + calculatedDrawers,
            legsCount: Math.ceil(w / 600) * 2,
          },
          materials: {
            carcassMaterial: fItem.carcassMaterial || '18mm BWP Plywood',
            carcassFinish: fItem.carcassFinish || 'Frosty White',
            shutterMaterial: fItem.shutterMaterial || '18mm HDHMR',
            shutterFinish: fItem.shutterFinish || 'Acrylic High Gloss',
            shutterColor: fItem.shutterColor || '#FAFAFA',
            counterMaterial: fItem.countertopMaterial,
          },
        });
      });
    } else {
      // Generate intelligent archetype layout based on room type if furniture rows were empty
      if (roomType === 'Kitchen') {
        // Modular Kitchen L/Straight counter
        const counterLength = Math.min(widthMm - 200, 2400);
        furniture.push({
          id: `furn_k_base_${roomIdx}`,
          catalogId: 'cat_kitchen_base',
          category: 'kitchen',
          name: 'Base Cooking & Sink Counter',
          x: 100,
          y: 80,
          z: 0,
          width: counterLength,
          height: 860,
          depth: 600,
          rotation: 0,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: 4,
            shutterType: 'hinged',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
            handleType: 'g_profile',
            drawerCount: 3,
            shelfCount: 1,
            hasLoft: false,
            loftHeight: 0,
            hasCountertop: true,
            countertopThickness: 20,
            countertopOverhang: 25,
            countertopMaterial: 'Quartz Calacatta Gold',
            skirtingHeight: 75,
            hingesCount: 8,
            slidePairs: 3,
            handlesCount: 4,
            legsCount: 6,
          },
          materials: {
            carcassMaterial: '18mm BWP Plywood',
            carcassFinish: 'Frosty White',
            shutterMaterial: '18mm HDHMR',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
            counterMaterial: 'Quartz Calacatta Gold',
          },
        });

        // Overhead Wall Cabinets
        furniture.push({
          id: `furn_k_wall_${roomIdx}`,
          catalogId: 'cat_kitchen_overhead',
          category: 'below_overhead',
          name: 'Wall Overhead Cabinets',
          x: 100,
          y: 80,
          z: 1450,
          width: counterLength,
          height: 700,
          depth: 350,
          rotation: 0,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: 4,
            shutterType: 'hinged',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
            handleType: 'push_to_open',
            drawerCount: 0,
            shelfCount: 2,
            hasLoft: false,
            loftHeight: 0,
            hasCountertop: false,
            countertopThickness: 0,
            countertopOverhang: 0,
            countertopMaterial: '',
            skirtingHeight: 0,
            hingesCount: 8,
            slidePairs: 0,
            handlesCount: 0,
            legsCount: 0,
          },
          materials: {
            carcassMaterial: '18mm BWP Plywood',
            carcassFinish: 'Frosty White',
            shutterMaterial: '18mm HDHMR',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
          },
        });
      } else if (roomType.includes('Bedroom')) {
        // 3-Door Wardrobe with Loft
        const wardrobeWidth = Math.min(widthMm - 400, 1800);
        furniture.push({
          id: `furn_bed_wardrobe_${roomIdx}`,
          catalogId: 'cat_wardrobe_3d',
          category: 'wardrobe',
          name: '3-Door Full Height Wardrobe with Loft',
          x: 80,
          y: 100,
          z: 0,
          width: wardrobeWidth,
          height: 2400,
          depth: 600,
          rotation: 0,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: 3,
            shutterType: 'hinged',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
            handleType: 'edge_lip',
            drawerCount: 2,
            shelfCount: 4,
            hasLoft: true,
            loftHeight: 600,
            hasCountertop: false,
            countertopThickness: 0,
            countertopOverhang: 0,
            countertopMaterial: '',
            skirtingHeight: 75,
            hingesCount: 9,
            slidePairs: 2,
            handlesCount: 5,
            legsCount: 6,
          },
          materials: {
            carcassMaterial: '18mm BWP Plywood',
            carcassFinish: 'Frosty White',
            shutterMaterial: '18mm HDHMR',
            shutterFinish: 'Acrylic High Gloss',
            shutterColor: '#FAFAFA',
          },
        });

        // King Bed
        furniture.push({
          id: `furn_bed_cot_${roomIdx}`,
          catalogId: 'cat_bed_king',
          category: 'bed',
          name: 'King Size Bed with Hydraulic Storage',
          x: Math.max(100, Math.round(widthMm / 2 - 915)),
          y: 100,
          z: 0,
          width: 1830,
          height: 1050,
          depth: 2050,
          rotation: 0,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: 0,
            shutterType: 'open',
            shutterFinish: 'Fabric Upholstered',
            shutterColor: '#334155',
            handleType: 'push_to_open',
            drawerCount: 2,
            shelfCount: 0,
            hasLoft: false,
            loftHeight: 0,
            hasCountertop: false,
            countertopThickness: 0,
            countertopOverhang: 0,
            countertopMaterial: '',
            skirtingHeight: 0,
            hingesCount: 0,
            slidePairs: 2,
            handlesCount: 0,
            legsCount: 4,
          },
          materials: {
            carcassMaterial: '18mm BWP Plywood',
            carcassFinish: 'Frosty White',
            shutterMaterial: 'Upholstered Fabric',
            shutterFinish: 'Fabric Slate Grey',
            shutterColor: '#334155',
          },
        });
      } else if (roomType === 'Living Room') {
        // TV Entertainment Unit
        const tvWidth = Math.min(widthMm - 400, 2200);
        furniture.push({
          id: `furn_liv_tv_${roomIdx}`,
          catalogId: 'cat_tv_unit',
          category: 'tv_unit',
          name: 'Floating TV Unit & Fluted Wall Panel',
          x: Math.max(100, Math.round(widthMm / 2 - tvWidth / 2)),
          y: 80,
          z: 250,
          width: tvWidth,
          height: 450,
          depth: 400,
          rotation: 0,
          parametric: {
            carcassThickness: 18,
            backPlyThickness: 9,
            shutterCount: 3,
            shutterType: 'hinged',
            shutterFinish: 'Walnut Woodgrain',
            shutterColor: '#78350F',
            handleType: 'push_to_open',
            drawerCount: 2,
            shelfCount: 1,
            hasLoft: false,
            loftHeight: 0,
            hasCountertop: false,
            countertopThickness: 0,
            countertopOverhang: 0,
            countertopMaterial: '',
            skirtingHeight: 0,
            hingesCount: 4,
            slidePairs: 2,
            handlesCount: 0,
            legsCount: 0,
          },
          materials: {
            carcassMaterial: '18mm BWP Plywood',
            carcassFinish: 'Frosty White',
            shutterMaterial: 'Natural Veneer',
            shutterFinish: 'Walnut Woodgrain',
            shutterColor: '#78350F',
          },
        });
      }
    }

    // 4. Dimensions & Center Annotation
    const dimensions: CadDimension[] = [
      { id: `dim1_${roomIdx}`, x1: 0, y1: -80, x2: widthMm, y2: -80, offset: 80, textOverride: `${widthMm} mm`, type: 'linear' },
      { id: `dim2_${roomIdx}`, x1: -80, y1: 0, x2: -80, y2: depthMm, offset: 80, textOverride: `${depthMm} mm`, type: 'linear' },
    ];

    const textAnnotations: TextAnnotation[] = [
      { id: `txt_${roomIdx}`, x: widthMm / 2, y: depthMm / 2, text: roomName.toUpperCase(), fontSize: 160 },
    ];

    const sectionCuts: SectionCut[] = [
      { id: `sec_${roomIdx}`, label: 'Section A-A', x1: 100, y1: Math.round(depthMm / 2), x2: widthMm - 100, y2: Math.round(depthMm / 2), viewDirection: 'up' },
    ];

    return {
      id: roomId,
      name: `${roomName} (${Math.round(widthMm / 304.8)}ft × ${Math.round(depthMm / 304.8)}ft)`,
      type: roomType,
      widthMm,
      depthMm,
      heightMm,
      walls,
      doors,
      windows,
      columns: [],
      furniture,
      dimensions,
      textAnnotations,
      sectionCuts,
    };
  });

  const generatedProject: ProjectInfo = {
    id: `proj_xl_${Date.now()}`,
    name: projectName,
    customerName,
    siteAddress,
    projectType,
    unitSystem: 'mm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rooms: generatedRooms,
    activeRoomId: generatedRooms[0]?.id || '',
    selectedFurnitureId: null,
    selectedWallId: null,
    selectedDoorId: null,
    selectedWindowId: null,
  };

  return {
    success: true,
    errors,
    warnings,
    projectName,
    projectType,
    customerName,
    siteAddress,
    parsedRooms,
    parsedFurniture,
    parsedOpenings,
    generatedProject,
  };
}

/**
 * Creates and triggers download of a standardized Excel Template (.xlsx)
 * with sample measurements, instructions, and column documentation.
 */
export function generateSampleExcelWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. INSTRUCTIONS SHEET
  const instructionsData = [
    { 'HOW TO USE THIS TEMPLATE': '1. Fill in the "Rooms & Dimensions" sheet with your room sizes (accepts mm, ft, inches, or meters).' },
    { 'HOW TO USE THIS TEMPLATE': '2. Fill in the "Furniture & Layout" sheet with your modular wardrobes, kitchens, TV units, beds, etc.' },
    { 'HOW TO USE THIS TEMPLATE': '3. Fill in the "Doors & Windows" sheet with wall openings and dimensions.' },
    { 'HOW TO USE THIS TEMPLATE': '4. Upload this file back into the application using "Upload Excel" to generate 2D plans, 3D views, and cutting lists.' },
    { 'HOW TO USE THIS TEMPLATE': '' },
    { 'HOW TO USE THIS TEMPLATE': 'ACCEPTED UNITS FORMAT:' },
    { 'HOW TO USE THIS TEMPLATE': '• Millimeters: 3658, 3658mm, 1200' },
    { 'HOW TO USE THIS TEMPLATE': '• Feet & Inches: 12ft, 12\', 12\'6", 12 ft 6 in, 10.5ft' },
    { 'HOW TO USE THIS TEMPLATE': '• Meters / Centimeters: 3.65m, 365cm' },
    { 'HOW TO USE THIS TEMPLATE': '' },
    { 'HOW TO USE THIS TEMPLATE': 'CATEGORIES RECOGNIZED:' },
    { 'HOW TO USE THIS TEMPLATE': '• wardrobe, kitchen, below_overhead, tv_unit, bed, sitting, vertical_box, office, pooja, utility' },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Guide');

  // 2. ROOMS SHEET
  const roomsData = [
    {
      'Room Name': 'Living & Dining Room',
      'Room Type': 'Living Room',
      'Width (mm or ft)': '5500 mm (18ft)',
      'Depth (mm or ft)': '4200 mm (13ft 9in)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Notes': 'Main family hall with balcony and TV wall',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Room Type': 'Kitchen',
      'Width (mm or ft)': '3658 mm (12ft)',
      'Depth (mm or ft)': '3048 mm (10ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Notes': 'L-Shape layout with Quartz Calacatta countertop',
    },
    {
      'Room Name': 'Master Bedroom Suite',
      'Room Type': 'Master Bedroom',
      'Width (mm or ft)': '4267 mm (14ft)',
      'Depth (mm or ft)': '3658 mm (12ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Notes': 'Includes 4-Door Wardrobe with loft and King Bed',
    },
    {
      'Room Name': 'Kids / Guest Bedroom',
      'Room Type': 'Bedroom 2',
      'Width (mm or ft)': '3658 mm (12ft)',
      'Depth (mm or ft)': '3350 mm (11ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Notes': 'Includes 3-Door Wardrobe and Study Desk',
    },
    {
      'Room Name': 'Pooja Room',
      'Room Type': 'Pooja',
      'Width (mm or ft)': '1800 mm (6ft)',
      'Depth (mm or ft)': '1500 mm (5ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Notes': 'Teak wood CNC mandir unit',
    },
  ];
  const wsRooms = XLSX.utils.json_to_sheet(roomsData);
  XLSX.utils.book_append_sheet(wb, wsRooms, 'Rooms & Dimensions');

  // 3. FURNITURE & MODULES SHEET
  const furnitureData = [
    {
      'Room Name': 'Master Bedroom Suite',
      'Item Name': '4-Door Full Height Wardrobe with Loft',
      'Category': 'wardrobe',
      'Width (mm)': 2400,
      'Depth (mm)': 600,
      'Height (mm)': 2400,
      'Z Elevation (mm)': 0,
      'Wall Placement': 'left_wall',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': '18mm HDHMR',
      'Shutter Finish': 'Acrylic High Gloss',
      'Shutter Color': '#FAFAFA',
      'Shutters': 4,
      'Shelves': 5,
      'Drawers': 2,
      'Has Loft (Yes/No)': 'Yes',
      'Loft Height (mm)': 600,
      'Has Countertop': 'No',
    },
    {
      'Room Name': 'Master Bedroom Suite',
      'Item Name': 'King Size Bed with Headboard',
      'Category': 'bed',
      'Width (mm)': 1830,
      'Depth (mm)': 2050,
      'Height (mm)': 1050,
      'Z Elevation (mm)': 0,
      'Wall Placement': 'center',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': 'Upholstered Fabric',
      'Shutter Finish': 'Fabric Slate Grey',
      'Shutter Color': '#334155',
      'Shutters': 0,
      'Shelves': 0,
      'Drawers': 2,
      'Has Loft (Yes/No)': 'No',
      'Has Countertop': 'No',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Item Name': 'Base Cooking & Hob Counter',
      'Category': 'kitchen',
      'Width (mm)': 2400,
      'Depth (mm)': 600,
      'Height (mm)': 860,
      'Z Elevation (mm)': 0,
      'Wall Placement': 'back_wall',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': '18mm HDHMR',
      'Shutter Finish': 'Acrylic High Gloss',
      'Shutter Color': '#FAFAFA',
      'Shutters': 4,
      'Shelves': 1,
      'Drawers': 3,
      'Has Loft (Yes/No)': 'No',
      'Has Countertop': 'Yes',
      'Countertop Material': '20mm Quartz Calacatta Gold',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Item Name': 'Overhead Wall Storage Cabinets',
      'Category': 'below_overhead',
      'Width (mm)': 2400,
      'Depth (mm)': 350,
      'Height (mm)': 700,
      'Z Elevation (mm)': 1450,
      'Wall Placement': 'back_wall',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': '18mm HDHMR',
      'Shutter Finish': 'Acrylic High Gloss',
      'Shutter Color': '#FAFAFA',
      'Shutters': 4,
      'Shelves': 2,
      'Drawers': 0,
      'Has Loft (Yes/No)': 'No',
      'Has Countertop': 'No',
    },
    {
      'Room Name': 'Living & Dining Room',
      'Item Name': 'Floating TV Console with Louvered Fluted Panel',
      'Category': 'tv_unit',
      'Width (mm)': 2200,
      'Depth (mm)': 400,
      'Height (mm)': 450,
      'Z Elevation (mm)': 250,
      'Wall Placement': 'front_wall',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': 'Natural Veneer',
      'Shutter Finish': 'Walnut Woodgrain',
      'Shutter Color': '#78350F',
      'Shutters': 3,
      'Shelves': 1,
      'Drawers': 2,
      'Has Loft (Yes/No)': 'No',
      'Has Countertop': 'No',
    },
    {
      'Room Name': 'Kids / Guest Bedroom',
      'Item Name': '3-Door Wardrobe with Integrated Bookshelf',
      'Category': 'wardrobe',
      'Width (mm)': 1800,
      'Depth (mm)': 600,
      'Height (mm)': 2400,
      'Z Elevation (mm)': 0,
      'Wall Placement': 'left_wall',
      'Carcass Material': '18mm BWP Plywood',
      'Carcass Finish': 'Frosty White',
      'Shutter Material': '18mm HDHMR',
      'Shutter Finish': 'PU Matte Finish - Sage Green',
      'Shutter Color': '#7C9082',
      'Shutters': 3,
      'Shelves': 4,
      'Drawers': 2,
      'Has Loft (Yes/No)': 'Yes',
      'Loft Height (mm)': 600,
      'Has Countertop': 'No',
    },
  ];
  const wsFurniture = XLSX.utils.json_to_sheet(furnitureData);
  XLSX.utils.book_append_sheet(wb, wsFurniture, 'Furniture & Layout');

  // 4. DOORS & WINDOWS SHEET
  const openingsData = [
    {
      'Room Name': 'Living & Dining Room',
      'Type': 'Door',
      'Wall Side': 'bottom',
      'Width (mm)': 1050,
      'Height (mm)': 2400,
      'Sill Height (mm)': 0,
      'Offset (mm)': 600,
      'Swing': 'inward_right',
    },
    {
      'Room Name': 'Living & Dining Room',
      'Type': 'Window',
      'Wall Side': 'top',
      'Width (mm)': 2400,
      'Height (mm)': 1500,
      'Sill Height (mm)': 600,
      'Offset (mm)': 1000,
      'Swing': 'sliding',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Type': 'Door',
      'Wall Side': 'bottom',
      'Width (mm)': 900,
      'Height (mm)': 2100,
      'Sill Height (mm)': 0,
      'Offset (mm)': 400,
      'Swing': 'inward_left',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Type': 'Window',
      'Wall Side': 'top',
      'Width (mm)': 1200,
      'Height (mm)': 1000,
      'Sill Height (mm)': 1000,
      'Offset (mm)': 1200,
      'Swing': 'sliding',
    },
    {
      'Room Name': 'Master Bedroom Suite',
      'Type': 'Door',
      'Wall Side': 'bottom',
      'Width (mm)': 900,
      'Height (mm)': 2100,
      'Sill Height (mm)': 0,
      'Offset (mm)': 400,
      'Swing': 'inward_right',
    },
    {
      'Room Name': 'Master Bedroom Suite',
      'Type': 'Window',
      'Wall Side': 'top',
      'Width (mm)': 1500,
      'Height (mm)': 1200,
      'Sill Height (mm)': 900,
      'Offset (mm)': 1200,
      'Swing': 'sliding',
    },
  ];
  const wsOpenings = XLSX.utils.json_to_sheet(openingsData);
  XLSX.utils.book_append_sheet(wb, wsOpenings, 'Doors & Windows');

  // Convert to binary buffer
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Creates and triggers download of a Single-Sheet Flat Excel Template (.xlsx)
 * where each row directly defines a unique room and optional furniture/door/window parameters.
 */
export function generateFlatSampleExcelWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const flatRowsData = [
    {
      'Room Name': 'Master Bedroom Suite',
      'Room Type': 'Master Bedroom',
      'Width (mm or ft)': '4267 mm (14ft)',
      'Depth (mm or ft)': '3658 mm (12ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': '4-Door Wardrobe with Loft',
      'Door Width (mm)': 900,
      'Window Width (mm)': 1500,
      'Notes': 'Master bedroom with king bed and full-height wardrobe',
    },
    {
      'Room Name': 'Modular Kitchen',
      'Room Type': 'Kitchen',
      'Width (mm or ft)': '3658 mm (12ft)',
      'Depth (mm or ft)': '3048 mm (10ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': 'L-Shape Modular Kitchen Counter',
      'Door Width (mm)': 900,
      'Window Width (mm)': 1200,
      'Notes': 'Quartz countertop + upper wall storage units',
    },
    {
      'Room Name': 'Living & Dining Area',
      'Room Type': 'Living Room',
      'Width (mm or ft)': '5500 mm (18ft)',
      'Depth (mm or ft)': '4200 mm (13ft 9in)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': 'Floating TV Unit with Louvers',
      'Door Width (mm)': 1050,
      'Window Width (mm)': 2400,
      'Notes': 'Main entertainment zone and dining area',
    },
    {
      'Room Name': 'Kids Bedroom',
      'Room Type': 'Bedroom 2',
      'Width (mm or ft)': '3658 mm (12ft)',
      'Depth (mm or ft)': '3350 mm (11ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': '3-Door Wardrobe & Study Desk',
      'Door Width (mm)': 900,
      'Window Width (mm)': 1500,
      'Notes': 'Children study room with modular wardrobe',
    },
    {
      'Room Name': 'Guest Bedroom',
      'Room Type': 'Bedroom 3',
      'Width (mm or ft)': '3350 mm (11ft)',
      'Depth (mm or ft)': '3048 mm (10ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': '2-Door Sliding Wardrobe',
      'Door Width (mm)': 900,
      'Window Width (mm)': 1200,
      'Notes': 'Guest bedroom suite',
    },
    {
      'Room Name': 'Pooja Room',
      'Room Type': 'Pooja',
      'Width (mm or ft)': '1800 mm (6ft)',
      'Depth (mm or ft)': '1500 mm (5ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': 'CNC Teak Mandir Unit',
      'Door Width (mm)': 750,
      'Window Width (mm)': 600,
      'Notes': 'Pooja sanctuary',
    },
    {
      'Room Name': 'Home Office & Study',
      'Room Type': 'Office',
      'Width (mm or ft)': '3048 mm (10ft)',
      'Depth (mm or ft)': '2438 mm (8ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': 'Executive Work Desk & Bookcase',
      'Door Width (mm)': 900,
      'Window Width (mm)': 1200,
      'Notes': 'Dedicated workspace',
    },
    {
      'Room Name': 'Balcony & Utility',
      'Room Type': 'Utility',
      'Width (mm or ft)': '3000 mm (10ft)',
      'Depth (mm or ft)': '1500 mm (5ft)',
      'Ceiling Height (mm)': 2900,
      'Wall Thickness (mm)': 150,
      'Furniture Item': 'Utility Storage & Washing Counter',
      'Door Width (mm)': 800,
      'Window Width (mm)': 1800,
      'Notes': 'Washing machine and service utility balcony',
    },
  ];

  const wsFlat = XLSX.utils.json_to_sheet(flatRowsData);
  XLSX.utils.book_append_sheet(wb, wsFlat, 'Multi-Room Floor Plan');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Generates a clean CSV sample format string.
 */
export function generateSampleCsvString(): string {
  const headers = [
    'Room Name',
    'Room Type',
    'Width (mm or ft)',
    'Depth (mm or ft)',
    'Ceiling Height (mm)',
    'Wall Thickness (mm)',
    'Furniture Item',
    'Door Width (mm)',
    'Window Width (mm)',
    'Notes',
  ];

  const rows = [
    ['Master Bedroom Suite', 'Master Bedroom', '4267 mm', '3658 mm', '2900', '150', '4-Door Wardrobe with Loft', '900', '1500', 'Master bedroom with king bed'],
    ['Modular Kitchen', 'Kitchen', '3658 mm', '3048 mm', '2900', '150', 'L-Shape Modular Kitchen Counter', '900', '1200', 'Quartz countertop + wall cabinets'],
    ['Living & Dining Area', 'Living Room', '5500 mm', '4200 mm', '2900', '150', 'Floating TV Unit with Louvers', '1050', '2400', 'Main entertainment and dining'],
    ['Kids Bedroom', 'Bedroom 2', '3658 mm', '3350 mm', '2900', '150', '3-Door Wardrobe & Study Desk', '900', '1500', 'Kids bedroom'],
    ['Guest Bedroom', 'Bedroom 3', '3350 mm', '3048 mm', '2900', '150', '2-Door Sliding Wardrobe', '900', '1200', 'Guest room'],
    ['Pooja Room', 'Pooja', '1800 mm', '1500 mm', '2900', '150', 'CNC Teak Mandir Unit', '750', '600', 'Mandir sanctuary'],
    ['Home Office', 'Office', '3048 mm', '2438 mm', '2900', '150', 'Executive Desk & Bookcase', '900', '1200', 'Work from home office'],
    ['Balcony / Utility', 'Utility', '3000 mm', '1500 mm', '2900', '150', 'Utility Storage Counter', '800', '1800', 'Service balcony'],
  ];

  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
  ];

  return csvLines.join('\n');
}
