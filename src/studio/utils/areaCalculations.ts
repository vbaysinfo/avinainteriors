import { Room, ProjectInfo } from '../types/cad';

export interface RoomAreaMetrics {
  roomId: string;
  roomName: string;
  roomType: string;
  widthMm: number;
  depthMm: number;
  widthFt: number;
  depthFt: number;
  sqM: number;
  sqFt: number;
  perimeterM: number;
  perimeterFt: number;
  formattedSqFt: string;
  formattedSqM: string;
  formattedDimensionsMm: string;
  formattedDimensionsFt: string;
}

export interface ProjectAreaMetrics {
  totalSqM: number;
  totalSqFt: number;
  totalRooms: number;
  formattedTotalSqFt: string;
  formattedTotalSqM: string;
  rooms: Array<
    RoomAreaMetrics & {
      percentageOfProject: number;
      furnitureCount: number;
    }
  >;
}

/**
 * Calculates precise carpet area, dimensions, and perimeter for a single room.
 */
export function calculateRoomArea(room: Room): RoomAreaMetrics {
  const widthMm = Math.max(100, room.widthMm || 3000);
  const depthMm = Math.max(100, room.depthMm || 3000);

  const sqM = (widthMm * depthMm) / 1_000_000;
  const sqFt = sqM * 10.7639104;

  const widthFt = (widthMm / 304.8);
  const depthFt = (depthMm / 304.8);

  const perimeterM = ((widthMm + depthMm) * 2) / 1_000;
  const perimeterFt = perimeterM * 3.28084;

  // Format ft-inches string: e.g. 11'6" × 10'0"
  const formatFtIn = (mm: number) => {
    const totalInches = Math.round(mm / 25.4);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  return {
    roomId: room.id,
    roomName: room.name,
    roomType: room.type,
    widthMm,
    depthMm,
    widthFt: Math.round(widthFt * 10) / 10,
    depthFt: Math.round(depthFt * 10) / 10,
    sqM: Math.round(sqM * 100) / 100,
    sqFt: Math.round(sqFt * 10) / 10,
    perimeterM: Math.round(perimeterM * 100) / 100,
    perimeterFt: Math.round(perimeterFt * 10) / 10,
    formattedSqFt: (Math.round(sqFt * 10) / 10).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    formattedSqM: (Math.round(sqM * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formattedDimensionsMm: `${widthMm} × ${depthMm} mm`,
    formattedDimensionsFt: `${formatFtIn(widthMm)} × ${formatFtIn(depthMm)}`,
  };
}

/**
 * Calculates complete project carpet area metrics, sum of all rooms, and relative percentages.
 */
export function calculateProjectArea(project: ProjectInfo): ProjectAreaMetrics {
  const roomMetrics = (project.rooms || []).map((r) => calculateRoomArea(r));
  const totalSqM = roomMetrics.reduce((sum, r) => sum + r.sqM, 0);
  const totalSqFt = roomMetrics.reduce((sum, r) => sum + r.sqFt, 0);

  const enrichedRooms = roomMetrics.map((rm) => {
    const rawRoom = project.rooms.find((r) => r.id === rm.roomId);
    const percentage = totalSqFt > 0 ? (rm.sqFt / totalSqFt) * 100 : 0;
    return {
      ...rm,
      percentageOfProject: Math.round(percentage * 10) / 10,
      furnitureCount: rawRoom?.furniture?.length || 0,
    };
  });

  return {
    totalSqM: Math.round(totalSqM * 100) / 100,
    totalSqFt: Math.round(totalSqFt * 10) / 10,
    totalRooms: enrichedRooms.length,
    formattedTotalSqFt: (Math.round(totalSqFt * 10) / 10).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    formattedTotalSqM: (Math.round(totalSqM * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    rooms: enrichedRooms,
  };
}
