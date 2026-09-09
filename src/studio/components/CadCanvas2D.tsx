'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectInfo, Room, FurnitureItem, CadTool, Wall, Door, Window, Column } from '../types/cad';
import { calculateIntelligentSnapping, GuideLine } from '../utils/snappingEngine';
import { recalculateParametricFurniture, mirrorFurnitureItem } from '../utils/parametricEngine';
import { calculateAutoDimensions, generateCadDimensionsForRoom } from '../utils/autoDimensionEngine';
import { detectRoomCollisions, clampItemToRoomBounds } from '../utils/collisionEngine';
import { calculateRoomArea, calculateProjectArea } from '../utils/areaCalculations';
import { FurnitureFloatingToolbar } from './FurnitureFloatingToolbar';
import {
  RotateCw,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  ArrowLeftRight,
  ArrowUpDown,
  FlipHorizontal,
  FlipVertical,
  XCircle,
  Sparkles,
  Plus,
  Minus,
  Check,
  Ruler,
  Layers,
  Eraser,
  LayoutGrid,
  DoorOpen,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Home,
} from 'lucide-react';

interface CadCanvas2DProps {
  project: ProjectInfo;
  activeRoom: Room;
  activeTool: CadTool;
  onSelectFurniture: (id: string | null) => void;
  onSelectDoor?: (id: string | null) => void;
  onSelectWindow?: (id: string | null) => void;
  onSelectColumn?: (id: string | null) => void;
  onSelectWall?: (id: string | null) => void;
  onSelectText?: (id: string | null) => void;
  onClearSelection?: () => void;
  onUpdateRoom: (updatedRoom: Room) => void;
  onUpdateFurniture?: (updatedItem: FurnitureItem) => void;
  onDeleteFurniture?: (id: string) => void;
  onToolChange: (tool: CadTool) => void;
  onOpenClearModal?: () => void;
}

export const CadCanvas2D: React.FC<CadCanvas2DProps> = ({
  project,
  activeRoom,
  activeTool,
  onSelectFurniture,
  onSelectDoor,
  onSelectWindow,
  onSelectColumn,
  onSelectWall,
  onSelectText,
  onClearSelection,
  onUpdateRoom,
  onUpdateFurniture,
  onDeleteFurniture,
  onToolChange,
  onOpenClearModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Transform (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(0.18); // mm to screen pixels scale (e.g. 0.18 = ~180px per 1000mm)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 100 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-Dimension State
  const [showAutoDimensions, setShowAutoDimensions] = useState<boolean>(true);
  const [showShutterShelfDetails, setShowShutterShelfDetails] = useState<boolean>(true);
  const [showCollisionHighlights, setShowCollisionHighlights] = useState<boolean>(true);
  const [dimBakeToast, setDimBakeToast] = useState<string | null>(null);

  // Mouse Coordinates in mm
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging Furniture
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSnapBadge, setActiveSnapBadge] = useState<{ x: number; y: number; text: string } | null>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);
  const [alignedItemIds, setAlignedItemIds] = useState<string[]>([]);

  // Parametric Resizing
  type ResizeHandle = 'left' | 'right' | 'top' | 'bottom' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  const [resizingItemId, setResizingItemId] = useState<string | null>(null);
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [initialResizeBox, setInitialResizeBox] = useState<{ x: number; y: number; width: number; depth: number } | null>(null);
  const [liveResizeDimension, setLiveResizeDimension] = useState<{ label: string; value: number } | null>(null);

  // Measure Tool State
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);

  // Wall Drawing Tool State
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);

  // Helper to convert screen to CAD world mm coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: Math.round((screenX - pan.x) / zoom),
      y: Math.round((screenY - pan.y) / zoom),
    };
  }, [pan.x, pan.y, zoom]);

  // Helper to convert CAD world mm to screen pixels
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX * zoom + pan.x,
      y: worldY * zoom + pan.y,
    };
  }, [pan.x, pan.y, zoom]);

  const selectedFurniture = activeRoom.furniture.find((f) => f.id === project.selectedFurnitureId);

  // Calculate live auto dimensions
  const liveAutoDimensions = useMemo(() => {
    return calculateAutoDimensions(activeRoom);
  }, [activeRoom]);

  // Calculate live room collisions and boundary violations
  const collisionReport = useMemo(() => {
    return detectRoomCollisions(activeRoom);
  }, [activeRoom]);

  // Select next conflicting furniture item
  const handleSelectNextConflict = () => {
    if (collisionReport.itemsWithIssues.length === 0) return;
    const currentIdx = collisionReport.itemsWithIssues.findIndex((item) => item.itemId === project.selectedFurnitureId);
    const nextIdx = (currentIdx + 1) % collisionReport.itemsWithIssues.length;
    const nextItem = collisionReport.itemsWithIssues[nextIdx];
    if (nextItem) {
      onSelectFurniture(nextItem.itemId);
    }
  };

  // Auto-clamp all out-of-bounds furniture into room limits
  const handleAutoFixAllBounds = () => {
    const updatedList = activeRoom.furniture.map((item) =>
      clampItemToRoomBounds(item, activeRoom.widthMm, activeRoom.depthMm)
    );
    onUpdateRoom({ ...activeRoom, furniture: updatedList });
    setDimBakeToast('All furniture aligned within room boundary limits');
    setTimeout(() => setDimBakeToast(null), 2500);
  };

  // Zoom to Fit Handler
  const handleZoomToFit = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 140;
    const availableWidth = clientWidth - padding;
    const availableHeight = clientHeight - padding;

    const scaleX = availableWidth / activeRoom.widthMm;
    const scaleY = availableHeight / activeRoom.depthMm;
    const newZoom = Math.min(scaleX, scaleY, 0.35);

    const newPanX = (clientWidth - activeRoom.widthMm * newZoom) / 2;
    const newPanY = (clientHeight - activeRoom.depthMm * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [activeRoom.widthMm, activeRoom.depthMm]);

  // Zoom In / Out Helper Functions
  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    const newZoom = Math.min(1.8, zoom * 1.25);
    const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [pan.x, pan.y, zoom]);

  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    const newZoom = Math.max(0.04, zoom * 0.8);
    const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [pan.x, pan.y, zoom]);

  const handleZoomReset = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const targetZoom = 0.2; // 1:5 scale
    const newPanX = (clientWidth - activeRoom.widthMm * targetZoom) / 2;
    const newPanY = (clientHeight - activeRoom.depthMm * targetZoom) / 2;
    setZoom(targetZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [activeRoom.widthMm, activeRoom.depthMm]);

  // Bake Auto-Dimensions into Room CAD dimensions
  const handleBakeAutoDimensions = useCallback(() => {
    const baked = generateCadDimensionsForRoom(activeRoom);
    onUpdateRoom({
      ...activeRoom,
      dimensions: baked,
    });
    setDimBakeToast(`Saved ${baked.length} dimensions to drawing`);
    setTimeout(() => setDimBakeToast(null), 3000);
  }, [activeRoom, onUpdateRoom]);

  useEffect(() => {
    handleZoomToFit();
  }, [activeRoom.id]);

  // Auto-dimension tool sync
  useEffect(() => {
    if (activeTool === 'AUTO_DIMENSION') {
      setShowAutoDimensions(true);
    }
  }, [activeTool]);

  // Main Render Loop for CAD Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Light CAD Canvas Background
    ctx.fillStyle = '#f8fafc'; // Crisp architectural drafting paper
    ctx.fillRect(0, 0, width, height);

    // 2. Precision AutoCAD Grid
    const gridSize = 100; // 100mm minor grid
    const majorGridSize = 500; // 500mm major grid

    const startX = Math.floor((-pan.x / zoom) / gridSize) * gridSize;
    const endX = Math.ceil(((width - pan.x) / zoom) / gridSize) * gridSize;
    const startY = Math.floor((-pan.y / zoom) / gridSize) * gridSize;
    const endY = Math.ceil(((height - pan.y) / zoom) / gridSize) * gridSize;

    // Minor Grid Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      const sx = x * zoom + pan.x;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      const sy = y * zoom + pan.y;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // Major Grid Lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let x = Math.floor(startX / majorGridSize) * majorGridSize; x <= endX; x += majorGridSize) {
      const sx = x * zoom + pan.x;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    for (let y = Math.floor(startY / majorGridSize) * majorGridSize; y <= endY; y += majorGridSize) {
      const sy = y * zoom + pan.y;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // 3. Room Floor Fill
    const roomScreen = worldToScreen(0, 0);
    const roomWidthPx = activeRoom.widthMm * zoom;
    const roomDepthPx = activeRoom.depthMm * zoom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(roomScreen.x, roomScreen.y, roomWidthPx, roomDepthPx);

    // Subtle checkered tile pattern on floor
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.5;
    const tileMm = 600; // 600x600mm vitrified tiles
    for (let tx = 0; tx <= activeRoom.widthMm; tx += tileMm) {
      const p1 = worldToScreen(tx, 0);
      const p2 = worldToScreen(tx, activeRoom.depthMm);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let ty = 0; ty <= activeRoom.depthMm; ty += tileMm) {
      const p1 = worldToScreen(0, ty);
      const p2 = worldToScreen(activeRoom.widthMm, ty);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 3.5 Architectural Floor Room Title & Carpet Area Watermark (AutoCAD Style)
    const centerFloor = worldToScreen(activeRoom.widthMm / 2, activeRoom.depthMm / 2);
    const roomAreaSqM = ((activeRoom.widthMm * activeRoom.depthMm) / 1000000).toFixed(2);
    const roomAreaSqFt = (((activeRoom.widthMm * activeRoom.depthMm) / 1000000) * 10.7639).toFixed(1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Room Name in elegant watermark
    const fontSizeTitle = Math.max(13, Math.min(28, 18 * zoom * 3.5));
    ctx.font = `bold ${fontSizeTitle}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(71, 85, 105, 0.28)';
    ctx.fillText(activeRoom.name.toUpperCase(), centerFloor.x, centerFloor.y - fontSizeTitle * 0.7);

    // Dimensions & Carpet Area Subtitle
    const fontSizeSub = Math.max(10, Math.min(16, 12 * zoom * 3.5));
    ctx.font = `600 ${fontSizeSub}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.fillText(`${activeRoom.widthMm} × ${activeRoom.depthMm} mm`, centerFloor.x, centerFloor.y + fontSizeSub * 0.6);

    ctx.font = `bold ${fontSizeSub + 1}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.fillText(`${roomAreaSqFt} SQ.FT (${roomAreaSqM} m²)`, centerFloor.x, centerFloor.y + fontSizeSub * 1.9);
    ctx.restore();

    // 4. Room Outer Boundary Walls
    activeRoom.walls.forEach((w) => {
      const isSelected = project.selectedWallId === w.id;
      const p1 = worldToScreen(w.x1, w.y1);
      const p2 = worldToScreen(w.x2, w.y2);
      const thickPx = Math.max(4, w.thickness * zoom);

      ctx.strokeStyle = isSelected ? '#9333ea' : '#334155'; // Dark slate structural wall
      ctx.lineWidth = isSelected ? thickPx + 4 : thickPx;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Wall core outline
      ctx.strokeStyle = isSelected ? '#c084fc' : '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (isSelected) {
        const wallLen = Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1));
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = '#9333ea';
        ctx.font = "bold 10px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`WALL: ${wallLen}mm (${w.thickness}mm)`, midX, midY - 10);
      }
    });

    // 5. Columns / Pillars
    activeRoom.columns.forEach((c) => {
      const isSelected = project.selectedColumnId === c.id;
      const p = worldToScreen(c.x, c.y);
      const wPx = c.width * zoom;
      const dPx = c.depth * zoom;

      ctx.fillStyle = isSelected ? '#047857' : '#64748b';
      ctx.fillRect(p.x, p.y, wPx, dPx);
      ctx.strokeStyle = isSelected ? '#10b981' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeRect(p.x, p.y, wPx, dPx);

      // Hatch cross
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + wPx, p.y + dPx);
      ctx.moveTo(p.x + wPx, p.y);
      ctx.lineTo(p.x, p.y + dPx);
      ctx.stroke();

      if (isSelected) {
        ctx.fillStyle = '#047857';
        ctx.font = "bold 10px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`COLUMN: ${c.width}×${c.depth}mm`, p.x + wPx / 2, p.y - 6);
      }
    });

    // 6. Windows
    activeRoom.windows.forEach((win) => {
      const isSelected = project.selectedWindowId === win.id;
      const p = worldToScreen(win.x, win.y);
      const wPx = win.width * zoom;
      const thickPx = 150 * zoom;

      ctx.fillStyle = isSelected ? '#bae6fd' : '#e0f2fe';
      ctx.fillRect(p.x, p.y - thickPx / 2, wPx, thickPx);
      ctx.strokeStyle = isSelected ? '#0284c7' : '#0ea5e9';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(p.x, p.y - thickPx / 2, wPx, thickPx);

      // Glass line in center
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + wPx, p.y);
      ctx.stroke();

      if (isSelected) {
        ctx.fillStyle = '#0284c7';
        ctx.font = "bold 10px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`WINDOW: ${win.width}×${win.height}mm`, p.x + wPx / 2, p.y - thickPx / 2 - 6);
      }
    });

    // 7. Doors & Swing Arcs
    activeRoom.doors.forEach((door) => {
      const isSelected = project.selectedDoorId === door.id;
      const p = worldToScreen(door.x, door.y);
      const wPx = door.width * zoom;

      // Clear wall opening
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x, p.y - 10, wPx, 20);

      // Door Leaf (90 degree open)
      ctx.strokeStyle = isSelected ? '#d97706' : '#ef4444';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - wPx);
      ctx.stroke();

      // Swing Radius Arc
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 1.8 : 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, wPx, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isSelected) {
        ctx.fillStyle = '#d97706';
        ctx.font = "bold 10px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`DOOR: ${door.width}×${door.height}mm`, p.x + wPx / 2, p.y + 18);
      }
    });

    // 8. Furniture Blocks (Parametric 2D Rendering with Visual Collision Detection)
    activeRoom.furniture.forEach((item) => {
      const isSelected = item.id === project.selectedFurnitureId;
      const p = worldToScreen(item.x, item.y);
      const wPx = item.width * zoom;
      const dPx = item.depth * zoom;

      const collisionInfo = showCollisionHighlights ? collisionReport.collisionMap.get(item.id) : undefined;
      const isColliding = !!collisionInfo?.hasCollision;

      // Base Box Fill & Style by Category (or Warning Red if Colliding)
      let fillColor = '#f8fafc';
      let strokeColor = '#3b82f6'; // Blue

      if (isColliding) {
        fillColor = isSelected ? 'rgba(254, 202, 202, 0.94)' : 'rgba(254, 226, 226, 0.85)';
        strokeColor = '#dc2626'; // Alert Red
      } else if (item.category === 'below_overhead') {
        fillColor = '#f0fdfa'; // Light teal
        strokeColor = '#0d9488'; // Teal
      } else if (item.category === 'sitting') {
        fillColor = '#ecfdf5'; // Light emerald
        strokeColor = '#059669'; // Emerald
      } else if (item.category === 'vertical_box') {
        fillColor = '#f5f3ff'; // Light violet
        strokeColor = '#7c3aed'; // Purple
      } else if (item.category === 'kitchen') {
        fillColor = item.z > 1000 ? '#e0e7ff' : '#e0f2fe'; // Wall cabinet vs Base
        strokeColor = item.z > 1000 ? '#6366f1' : '#0284c7';
      } else if (item.category === 'wardrobe') {
        fillColor = '#f1f5f9';
        strokeColor = '#475569';
      } else if (item.category === 'tv_unit') {
        fillColor = '#ffedd5';
        strokeColor = '#ea580c';
      } else if (item.category === 'bed') {
        fillColor = '#fef3c7';
        strokeColor = '#d97706';
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(p.x, p.y, wPx, dPx);

      // Carcass Outline (18mm standard carcass)
      ctx.strokeStyle = isSelected ? (isColliding ? '#b91c1c' : '#2563eb') : strokeColor;
      ctx.lineWidth = isSelected ? 2.5 : isColliding ? 2 : 1.5;
      if (item.category === 'below_overhead') {
        ctx.setLineDash([4, 2.5]); // Dashed line for 1ft mid-wall under-cabinet units
      } else if (isColliding) {
        ctx.setLineDash([5, 2.5]);
      }
      ctx.strokeRect(p.x, p.y, wPx, dPx);
      ctx.setLineDash([]);

      // Collision Warning Red Diagonal Hatch Lines
      if (isColliding) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.x, p.y, wPx, dPx);
        ctx.clip();
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.22)';
        ctx.lineWidth = 1.2;
        const spacing = Math.max(10, 16 * zoom);
        for (let hx = p.x - dPx; hx < p.x + wPx + dPx; hx += spacing) {
          ctx.beginPath();
          ctx.moveTo(hx, p.y);
          ctx.lineTo(hx + dPx, p.y + dPx);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render Exact Collision Overlap Geometries (Crimson Highlight)
      if (isColliding && collisionInfo?.overlapAreas && collisionInfo.overlapAreas.length > 0) {
        collisionInfo.overlapAreas.forEach((area) => {
          const oScreen = worldToScreen(area.x, area.y);
          const oW = area.width * zoom;
          const oD = area.depth * zoom;
          ctx.fillStyle = 'rgba(220, 38, 38, 0.42)';
          ctx.fillRect(oScreen.x, oScreen.y, oW, oD);
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([3, 2]);
          ctx.strokeRect(oScreen.x, oScreen.y, oW, oD);
          ctx.setLineDash([]);
        });
      }

      // Render Boundary Violation Geometries (Warning Striped Overhang)
      if (isColliding && collisionInfo?.boundaryViolations && collisionInfo.boundaryViolations.length > 0) {
        collisionInfo.boundaryViolations.forEach((v) => {
          const vScreen = worldToScreen(v.exceededRect.x, v.exceededRect.y);
          const vW = v.exceededRect.width * zoom;
          const vD = v.exceededRect.depth * zoom;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fillRect(vScreen.x, vScreen.y, vW, vD);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(vScreen.x, vScreen.y, vW, vD);
          ctx.setLineDash([]);
        });
      }

      const shutterCount = item.parametric.shutterCount || 0;
      const isCabinetOrWardrobe =
        item.category === 'wardrobe' ||
        item.category === 'kitchen' ||
        item.category === 'tv_unit' ||
        item.category === 'vertical_box' ||
        item.category === 'sitting' ||
        item.category === 'below_overhead';

      // 2D Shutter & Shelves Detailing Layer
      if (showShutterShelfDetails && isCabinetOrWardrobe) {
        const plyThickPx = Math.max(2, 18 * zoom);

        // 1. Inner Carcass Gables & Back Ply
        ctx.strokeStyle = isSelected ? '#93c5fd' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x + plyThickPx, p.y + plyThickPx, Math.max(4, wPx - plyThickPx * 2), Math.max(4, dPx - plyThickPx * 2));

        // 2. Internal Shelf Depth Line (Dashed)
        const shelfDepthPx = dPx * 0.75;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(p.x + plyThickPx, p.y + shelfDepthPx);
        ctx.lineTo(p.x + wPx - plyThickPx, p.y + shelfDepthPx);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Vertical Carcass Partitions
        if (shutterCount > 1) {
          const sw = wPx / shutterCount;
          ctx.strokeStyle = isSelected ? '#60a5fa' : '#94a3b8';
          ctx.lineWidth = 1.2;
          for (let i = 1; i < shutterCount; i++) {
            ctx.beginPath();
            ctx.moveTo(p.x + i * sw, p.y + plyThickPx);
            ctx.lineTo(p.x + i * sw, p.y + dPx - plyThickPx);
            ctx.stroke();
          }
        }

        // 4. Wardrobe Hanging Section Rail & Hangers
        if (item.category === 'wardrobe') {
          const railY = p.y + dPx * 0.45;
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x + plyThickPx + 8, railY);
          ctx.lineTo(p.x + wPx - plyThickPx - 8, railY);
          ctx.stroke();

          // Hanger circular indicators
          ctx.fillStyle = '#64748b';
          const hangerCount = Math.max(2, Math.min(6, Math.floor(item.width / 300)));
          const hangerStep = (wPx - plyThickPx * 2 - 20) / (hangerCount + 1);
          for (let h = 1; h <= hangerCount; h++) {
            ctx.beginPath();
            ctx.arc(p.x + plyThickPx + 10 + h * hangerStep, railY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 5. Sitting Box Cushion Tufting & Seating Hatch
        if (item.category === 'sitting') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          // Draw diamond tufts / cushion seam
          ctx.beginPath();
          ctx.moveTo(p.x + plyThickPx + 12, p.y + dPx / 2);
          ctx.lineTo(p.x + wPx - plyThickPx - 12, p.y + dPx / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 6. Front Shutter Layer & Handles
        ctx.fillStyle = isSelected ? 'rgba(37, 99, 235, 0.15)' : 'rgba(100, 116, 139, 0.1)';
        ctx.fillRect(p.x, p.y, wPx, plyThickPx);
        ctx.strokeStyle = isSelected ? '#1d4ed8' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, wPx, plyThickPx);

        // Shutter handle ticks on front
        if (shutterCount > 0) {
          const sw = wPx / shutterCount;
          ctx.fillStyle = '#f59e0b'; // Gold / amber handle tick
          for (let s = 0; s < shutterCount; s++) {
            const hx = p.x + s * sw + (s % 2 === 0 ? sw - 6 : 4);
            ctx.fillRect(hx, p.y - 1, 3, plyThickPx + 2);
          }
        }
      } else if (shutterCount > 1) {
        // Fallback simple shutter lines
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const sw = wPx / shutterCount;
        for (let i = 1; i < shutterCount; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + i * sw, p.y);
          ctx.lineTo(p.x + i * sw, p.y + dPx);
          ctx.stroke();
        }
      }

      // Drawer divisions / Tandem wire baskets diagonal lines or sink basin marker
      if (item.catalogId.includes('sink')) {
        // Draw SS sink basin oval/rect in 2D
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(p.x + wPx * 0.15, p.y + dPx * 0.2, wPx * 0.7, dPx * 0.6);
        // Faucet dot
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(p.x + wPx * 0.5, p.y + dPx * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.catalogId.includes('hob')) {
        // Draw 3/4 burner circles
        ctx.fillStyle = '#ea580c';
        const bRadius = Math.max(3, 8 * zoom);
        ctx.beginPath();
        ctx.arc(p.x + wPx * 0.3, p.y + dPx * 0.5, bRadius, 0, Math.PI * 2);
        ctx.arc(p.x + wPx * 0.7, p.y + dPx * 0.5, bRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.catalogId.includes('basket') || item.catalogId.includes('tandem') || item.catalogId.includes('pullout')) {
        // Draw wire basket rib indicators in 2D
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        const ribs = 3;
        for (let r = 1; r <= ribs; r++) {
          const ry = p.y + (dPx / (ribs + 1)) * r;
          ctx.beginPath();
          ctx.moveTo(p.x + 8, ry);
          ctx.lineTo(p.x + wPx - 8, ry);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      } else if (item.category === 'bed') {
        // Pillows
        const pillowW = wPx * 0.35;
        const pillowD = dPx * 0.2;
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(p.x + wPx * 0.1, p.y + dPx * 0.08, pillowW, pillowD);
        ctx.fillRect(p.x + wPx * 0.55, p.y + dPx * 0.08, pillowW, pillowD);
      }

      // High-Legibility Clean Frosted Badge for Furniture Text Label
      const labelText = item.name.split(' (')[0];
      const dimText = `${item.width}×${item.height}×${item.depth}`;
      const fontSize = Math.max(9, Math.min(12, 100 * zoom));

      ctx.font = `bold ${fontSize}px 'JetBrains Mono', sans-serif`;
      const nameMetrics = ctx.measureText(labelText);
      const badgeW = Math.min(wPx - 8, Math.max(nameMetrics.width + 16, 70));
      const badgeH = Math.max(22, fontSize * 2.2);
      const badgeX = p.x + (wPx - badgeW) / 2;
      const badgeY = p.y + (dPx - badgeH) / 2;

      // Frosted Pill Background (Red warning frosted pill if colliding)
      ctx.fillStyle = isColliding
        ? 'rgba(254, 242, 242, 0.98)'
        : isSelected
        ? 'rgba(239, 246, 255, 0.95)'
        : 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(badgeX + r, badgeY);
      ctx.lineTo(badgeX + badgeW - r, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r);
      ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH);
      ctx.lineTo(badgeX + r, badgeY + badgeH);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
      ctx.lineTo(badgeX, badgeY + r);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isColliding ? '#ef4444' : isSelected ? '#3b82f6' : '#cbd5e1';
      ctx.lineWidth = isColliding ? 1.5 : 1;
      ctx.stroke();

      // Furniture Text
      ctx.fillStyle = isColliding ? '#991b1b' : isSelected ? '#1e3a8a' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, p.x + wPx / 2, badgeY + badgeH * 0.35, badgeW - 8);

      // Dimension sub-label (or Collision Warning Tag)
      ctx.fillStyle = isColliding ? '#dc2626' : isSelected ? '#2563eb' : '#64748b';
      ctx.font = `bold ${Math.max(7.5, fontSize * 0.78)}px 'JetBrains Mono', sans-serif`;
      const subLabel = isColliding
        ? collisionInfo.isOutOfBounds
          ? '⚠️ OUT OF BOUNDS'
          : '⚠️ CLASH'
        : dimText;
      ctx.fillText(subLabel, p.x + wPx / 2, badgeY + badgeH * 0.75, badgeW - 8);

      // Top-Right Corner Collision Warning Badge
      if (isColliding && wPx > 42 && dPx > 30) {
        const cBadgeW = Math.min(wPx - 4, collisionInfo.isOutOfBounds ? 80 : 64);
        const cBadgeH = 16;
        const cBadgeX = p.x + wPx - cBadgeW - 3;
        const cBadgeY = p.y + 3;

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        const cr = 3;
        ctx.moveTo(cBadgeX + cr, cBadgeY);
        ctx.lineTo(cBadgeX + cBadgeW - cr, cBadgeY);
        ctx.quadraticCurveTo(cBadgeX + cBadgeW, cBadgeY, cBadgeX + cBadgeW, cBadgeY + cr);
        ctx.lineTo(cBadgeX + cBadgeW, cBadgeY + cBadgeH - cr);
        ctx.quadraticCurveTo(cBadgeX + cBadgeW, cBadgeY + cBadgeH, cBadgeX + cBadgeW - cr, cBadgeY + cBadgeH);
        ctx.lineTo(cBadgeX + cr, cBadgeY + cBadgeH);
        ctx.quadraticCurveTo(cBadgeX, cBadgeY + cBadgeH, cBadgeX, cBadgeY + cBadgeH - cr);
        ctx.lineTo(cBadgeX, cBadgeY + cr);
        ctx.quadraticCurveTo(cBadgeX, cBadgeY, cBadgeX + cr, cBadgeY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 8.5px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(collisionInfo.isOutOfBounds ? '⚠️ BOUNDS' : '⚠️ CLASH', cBadgeX + cBadgeW / 2, cBadgeY + cBadgeH / 2);
      }

      // 9. Selected Object Highlight & Parametric Drag Handles
      if (isSelected) {
        // High-contrast blue selection box
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 2, p.y - 2, wPx + 4, dPx + 4);

        // Dimension Callouts (AutoCAD style)
        // Top Width Callout
        const dimY = p.y - 18;
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, dimY);
        ctx.lineTo(p.x + wPx, dimY);
        // Ticks
        ctx.moveTo(p.x, dimY - 5);
        ctx.lineTo(p.x, dimY + 5);
        ctx.moveTo(p.x + wPx, dimY - 5);
        ctx.lineTo(p.x + wPx, dimY + 5);
        ctx.stroke();

        ctx.fillStyle = '#1d4ed8';
        ctx.font = "bold 11px 'JetBrains Mono', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`W: ${item.width} mm`, p.x + wPx / 2, dimY - 6);

        // Right Depth Callout
        const dimX = p.x + wPx + 18;
        ctx.beginPath();
        ctx.moveTo(dimX, p.y);
        ctx.lineTo(dimX, p.y + dPx);
        ctx.moveTo(dimX - 5, p.y);
        ctx.lineTo(dimX + 5, p.y);
        ctx.moveTo(dimX - 5, p.y + dPx);
        ctx.lineTo(dimX + 5, p.y + dPx);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillText(`D: ${item.depth} mm`, dimX + 6, p.y + dPx / 2);

        // Edge and Corner Handles
        const handleSize = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;

        const handles = [
          { x: p.x + wPx, y: p.y + dPx / 2 }, // Right Edge Handle
          { x: p.x, y: p.y + dPx / 2 }, // Left Edge Handle
          { x: p.x + wPx / 2, y: p.y }, // Top Edge Handle
          { x: p.x + wPx / 2, y: p.y + dPx }, // Bottom Edge Handle
          { x: p.x + wPx, y: p.y + dPx }, // Bottom-Right Corner
        ];

        handles.forEach((h) => {
          ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        });
      }
    });

    // 10. Draw Active Dynamic Alignment Lines & Smart Guides (OSNAP / Precision Alignment)
    activeGuides.forEach((g) => {
      const p1 = worldToScreen(g.x1, g.y1);
      const p2 = worldToScreen(g.x2, g.y2);

      // Main Alignment Guide Line
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3.5]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Precision Markers at Endpoints / Intersections
      const drawMarker = (x: number, y: number) => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
      };
      drawMarker(p1.x, p1.y);
      drawMarker(p2.x, p2.y);

      // Alignment Floating Tag Pill
      if (g.label) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
        const metrics = ctx.measureText(g.label);
        const padX = 6;
        const badgeW = metrics.width + padX * 2;
        const badgeH = 17;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH);
        ctx.strokeStyle = g.color;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH);

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.label, midX, midY + 0.5);
      }
    });

    // 11. Draw Live Measure Tool Line
    if (measureStart && measureCurrent) {
      const p1 = worldToScreen(measureStart.x, measureStart.y);
      const p2 = worldToScreen(measureCurrent.x, measureCurrent.y);
      const distMm = Math.round(Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y));

      ctx.strokeStyle = '#d97706'; // Amber
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance Badge
      ctx.fillStyle = '#d97706';
      ctx.fillRect((p1.x + p2.x) / 2 - 40, (p1.y + p2.y) / 2 - 14, 80, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 11px 'JetBrains Mono', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`${distMm} mm`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 1);
    }

    // 12. Active Live Wall Drawing Line
    if (wallStart && mouseWorldPos) {
      const p1 = worldToScreen(wallStart.x, wallStart.y);
      const p2 = worldToScreen(mouseWorldPos.x, mouseWorldPos.y);
      const wallLenMm = Math.round(Math.hypot(mouseWorldPos.x - wallStart.x, mouseWorldPos.y - wallStart.y));

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 150 * zoom;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Dimension Badge
      ctx.fillStyle = '#0284c7';
      ctx.fillRect((p1.x + p2.x) / 2 - 45, (p1.y + p2.y) / 2 - 14, 90, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = "bold 11px 'JetBrains Mono', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`${wallLenMm} mm`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 1);
    }

    // 13. Room Dimensions Outer Strings
    activeRoom.dimensions.forEach((dim) => {
      const p1 = worldToScreen(dim.x1, dim.y1);
      const p2 = worldToScreen(dim.x2, dim.y2);

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Tick marks
      ctx.beginPath();
      ctx.moveTo(p1.x - 5, p1.y - 5);
      ctx.lineTo(p1.x + 5, p1.y + 5);
      ctx.moveTo(p2.x - 5, p2.y - 5);
      ctx.lineTo(p2.x + 5, p2.y + 5);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = "bold 11px 'JetBrains Mono', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(dim.textOverride || '', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 6);
    });

    // 14. Intelligent Auto-Dimensions (Wall-to-Furniture & Furniture-to-Furniture Clearances)
    if (showAutoDimensions || activeTool === 'AUTO_DIMENSION') {
      liveAutoDimensions.forEach((dim) => {
        const p1 = worldToScreen(dim.x1, dim.y1);
        const p2 = worldToScreen(dim.x2, dim.y2);

        const isF2F = dim.type === 'furniture_to_furniture';
        const isWall = dim.type === 'wall_to_furniture';
        const isOverall = dim.type === 'room_overall';

        // High contrast colors for light theme: Green for Cabinet Gaps, Blue for Wall Clearances, Amber for Overall
        const color = isF2F ? '#059669' : isWall ? '#0284c7' : '#d97706';
        const textColor = isF2F ? '#065f46' : isWall ? '#0369a1' : '#92400e';
        const badgeBg = isF2F ? '#ecfdf5' : isWall ? '#f0f9ff' : '#fffbeb';
        const badgeBorder = isF2F ? '#6ee7b7' : isWall ? '#7dd3fc' : '#fcd34d';

        // Main Dimension Line
        ctx.strokeStyle = color;
        ctx.lineWidth = isOverall ? 1.5 : 1.2;
        ctx.setLineDash([4, 2.5]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Witness Ticks
        const tickSize = 4.5;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(p1.x - tickSize, p1.y - tickSize);
        ctx.lineTo(p1.x + tickSize, p1.y + tickSize);
        ctx.moveTo(p2.x - tickSize, p2.y - tickSize);
        ctx.lineTo(p2.x + tickSize, p2.y + tickSize);
        ctx.stroke();

        // Terminal Precision Point Dots
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 2, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Dimension Value Pill
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const text = `${dim.distanceMm} mm`;

        ctx.font = "bold 10px 'JetBrains Mono', sans-serif";
        const metrics = ctx.measureText(text);
        const padX = 5;
        const badgeW = metrics.width + padX * 2;
        const badgeH = 16;

        ctx.fillStyle = badgeBg;
        ctx.fillRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH);
        ctx.strokeStyle = badgeBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH);

        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, midX, midY + 0.5);
      });
    }

    // 15. Text Annotations
    activeRoom.textAnnotations.forEach((txt) => {
      const p = worldToScreen(txt.x, txt.y);
      ctx.fillStyle = '#64748B';
      ctx.font = `bold ${Math.max(12, txt.fontSize * zoom)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(txt.text, p.x, p.y);
    });
  }, [
    activeRoom,
    project.selectedFurnitureId,
    pan,
    zoom,
    worldToScreen,
    activeGuides,
    measureStart,
    measureCurrent,
    wallStart,
    mouseWorldPos,
    showAutoDimensions,
    liveAutoDimensions,
    activeTool,
  ]);

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseScreenX, mouseScreenY);

    // 1. Right Click (button === 2): Always cancel drawing/measuring/inserting tool and revert to SELECT
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      setWallStart(null);
      setMeasureStart(null);
      setMeasureCurrent(null);
      onToolChange('SELECT');
      return;
    }

    // Pan with Middle Mouse or Pan tool or space/shift
    if (e.button === 1 || activeTool === 'PAN' || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Measure Tool
    if (activeTool === 'MEASURE') {
      if (!measureStart) {
        setMeasureStart(worldPos);
        setMeasureCurrent(worldPos);
      } else {
        setMeasureStart(null);
        setMeasureCurrent(null);
        onToolChange('SELECT');
      }
      return;
    }

    // Wall Drawing Tool
    if (activeTool === 'WALL') {
      if (!wallStart) {
        setWallStart(worldPos);
      } else {
        // Complete wall segment
        const newWall: Wall = {
          id: `wall_${Date.now()}`,
          x1: wallStart.x,
          y1: wallStart.y,
          x2: worldPos.x,
          y2: worldPos.y,
          thickness: 150,
          height: 2900,
        };
        onUpdateRoom({
          ...activeRoom,
          walls: [...activeRoom.walls, newWall],
        });
        setWallStart(worldPos); // continue drawing chain
      }
      return;
    }

    // Door Insertion Tool
    if (activeTool === 'DOOR') {
      const newDoor: Door = {
        id: `door_${Date.now()}`,
        x: Math.round(worldPos.x / 50) * 50,
        y: Math.round(worldPos.y / 50) * 50,
        width: 900,
        height: 2100,
        wallSide: 'bottom',
        rotation: 0,
        swing: 'inward_left',
      };
      onUpdateRoom({ ...activeRoom, doors: [...activeRoom.doors, newDoor] });
      onToolChange('SELECT');
      return;
    }

    // Window Insertion Tool
    if (activeTool === 'WINDOW') {
      const newWindow: Window = {
        id: `win_${Date.now()}`,
        x: Math.round(worldPos.x / 50) * 50,
        y: Math.round(worldPos.y / 50) * 50,
        width: 1200,
        height: 1200,
        sillHeight: 900,
        wallSide: 'top',
        rotation: 0,
        type: 'sliding',
      };
      onUpdateRoom({ ...activeRoom, windows: [...activeRoom.windows, newWindow] });
      onToolChange('SELECT');
      return;
    }

    // Column Insertion Tool
    if (activeTool === 'COLUMN') {
      const newColumn: Column = {
        id: `col_${Date.now()}`,
        x: Math.round(worldPos.x / 50) * 50,
        y: Math.round(worldPos.y / 50) * 50,
        width: 300,
        depth: 300,
        height: 2900,
      };
      onUpdateRoom({ ...activeRoom, columns: [...activeRoom.columns, newColumn] });
      onToolChange('SELECT');
      return;
    }

    // Text Insertion Tool
    if (activeTool === 'TEXT') {
      const newText = {
        id: `txt_${Date.now()}`,
        x: Math.round(worldPos.x / 25) * 25,
        y: Math.round(worldPos.y / 25) * 25,
        text: 'Room Annotation',
        fontSize: 180,
      };
      onUpdateRoom({ ...activeRoom, textAnnotations: [...activeRoom.textAnnotations, newText] });
      onToolChange('SELECT');
      return;
    }

    // Check if clicked on Resize Handle of selected furniture
    if (selectedFurniture) {
      const p = worldToScreen(selectedFurniture.x, selectedFurniture.y);
      const wPx = selectedFurniture.width * zoom;
      const dPx = selectedFurniture.depth * zoom;
      const handleHitRadius = 14;

      // Right handle
      if (Math.hypot(mouseScreenX - (p.x + wPx), mouseScreenY - (p.y + dPx / 2)) < handleHitRadius) {
        setResizingItemId(selectedFurniture.id);
        setActiveResizeHandle('right');
        setInitialResizeBox({
          x: selectedFurniture.x,
          y: selectedFurniture.y,
          width: selectedFurniture.width,
          depth: selectedFurniture.depth,
        });
        return;
      }

      // Bottom handle
      if (Math.hypot(mouseScreenX - (p.x + wPx / 2), mouseScreenY - (p.y + dPx)) < handleHitRadius) {
        setResizingItemId(selectedFurniture.id);
        setActiveResizeHandle('bottom');
        setInitialResizeBox({
          x: selectedFurniture.x,
          y: selectedFurniture.y,
          width: selectedFurniture.width,
          depth: selectedFurniture.depth,
        });
        return;
      }

      // Bottom-Right Corner handle
      if (Math.hypot(mouseScreenX - (p.x + wPx), mouseScreenY - (p.y + dPx)) < handleHitRadius) {
        setResizingItemId(selectedFurniture.id);
        setActiveResizeHandle('bottom_right');
        setInitialResizeBox({
          x: selectedFurniture.x,
          y: selectedFurniture.y,
          width: selectedFurniture.width,
          depth: selectedFurniture.depth,
        });
        return;
      }
    }

    // 1. Hit Test Furniture items (with generous click tolerance)
    const clickTolerance = Math.max(12, 20 / Math.max(0.1, zoom));
    const clickedItem = [...activeRoom.furniture].reverse().find((item) => {
      const minX = item.x - clickTolerance;
      const maxX = item.x + item.width + clickTolerance;
      const minY = item.y - clickTolerance;
      const maxY = item.y + item.depth + clickTolerance;
      return (
        worldPos.x >= minX &&
        worldPos.x <= maxX &&
        worldPos.y >= minY &&
        worldPos.y <= maxY
      );
    });

    if (clickedItem) {
      onSelectFurniture(clickedItem.id);
      setDraggingItemId(clickedItem.id);
      setDragOffset({
        x: worldPos.x - clickedItem.x,
        y: worldPos.y - clickedItem.y,
      });
      return;
    }

    // 2. Hit Test Doors
    const clickedDoor = activeRoom.doors.find((d) => {
      return (
        worldPos.x >= d.x - 40 &&
        worldPos.x <= d.x + d.width + 40 &&
        worldPos.y >= d.y - 60 &&
        worldPos.y <= d.y + 60
      );
    });
    if (clickedDoor) {
      if (onSelectDoor) onSelectDoor(clickedDoor.id);
      return;
    }

    // 3. Hit Test Windows
    const clickedWin = activeRoom.windows.find((w) => {
      return (
        worldPos.x >= w.x - 40 &&
        worldPos.x <= w.x + w.width + 40 &&
        worldPos.y >= w.y - 120 &&
        worldPos.y <= w.y + 120
      );
    });
    if (clickedWin) {
      if (onSelectWindow) onSelectWindow(clickedWin.id);
      return;
    }

    // 4. Hit Test Columns
    const clickedCol = activeRoom.columns.find((c) => {
      return (
        worldPos.x >= c.x - 30 &&
        worldPos.x <= c.x + c.width + 30 &&
        worldPos.y >= c.y - 30 &&
        worldPos.y <= c.y + c.depth + 30
      );
    });
    if (clickedCol) {
      if (onSelectColumn) onSelectColumn(clickedCol.id);
      return;
    }

    // 5. Hit Test Text Annotations
    const clickedText = activeRoom.textAnnotations.find((t) => {
      return Math.hypot(worldPos.x - t.x, worldPos.y - t.y) < 200;
    });
    if (clickedText) {
      if (onSelectText) onSelectText(clickedText.id);
      return;
    }

    // 6. Hit Test Walls
    const clickedWall = activeRoom.walls.find((w) => {
      const A = worldPos.x - w.x1;
      const B = worldPos.y - w.y1;
      const C = w.x2 - w.x1;
      const D = w.y2 - w.y1;
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;
      let xx, yy;
      if (param < 0) {
        xx = w.x1;
        yy = w.y1;
      } else if (param > 1) {
        xx = w.x2;
        yy = w.y2;
      } else {
        xx = w.x1 + param * C;
        yy = w.y1 + param * D;
      }
      const dist = Math.hypot(worldPos.x - xx, worldPos.y - yy);
      return dist < Math.max(60, w.thickness);
    });
    if (clickedWall) {
      if (onSelectWall) onSelectWall(clickedWall.id);
      return;
    }

    // Clicked on empty canvas space -> Clear selection to return to Room Inspector
    if (onClearSelection) {
      onClearSelection();
    } else {
      onSelectFurniture(null);
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseScreenX, mouseScreenY);
    setMouseWorldPos(worldPos);

    // Pan
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Measure Tool
    if (measureStart) {
      setMeasureCurrent(worldPos);
      return;
    }

    // Parametric Resizing
    if (resizingItemId && activeResizeHandle && initialResizeBox && selectedFurniture) {
      let newWidth = initialResizeBox.width;
      let newDepth = initialResizeBox.depth;

      if (activeResizeHandle === 'right') {
        const deltaX = worldPos.x - (initialResizeBox.x + initialResizeBox.width);
        newWidth = Math.max(300, Math.min(4000, Math.round((initialResizeBox.width + deltaX) / 25) * 25));
        setLiveResizeDimension({ label: 'Width', value: newWidth });
      } else if (activeResizeHandle === 'bottom') {
        const deltaY = worldPos.y - (initialResizeBox.y + initialResizeBox.depth);
        newDepth = Math.max(250, Math.min(1200, Math.round((initialResizeBox.depth + deltaY) / 25) * 25));
        setLiveResizeDimension({ label: 'Depth', value: newDepth });
      } else if (activeResizeHandle === 'bottom_right') {
        const deltaX = worldPos.x - (initialResizeBox.x + initialResizeBox.width);
        const deltaY = worldPos.y - (initialResizeBox.y + initialResizeBox.depth);
        newWidth = Math.max(300, Math.min(4000, Math.round((initialResizeBox.width + deltaX) / 25) * 25));
        newDepth = Math.max(250, Math.min(1200, Math.round((initialResizeBox.depth + deltaY) / 25) * 25));
        setLiveResizeDimension({ label: `W: ${newWidth} × D: ${newDepth}`, value: newWidth });
      }

      // Update furniture with parametric recalculations in real-time
      const recalculated = recalculateParametricFurniture(selectedFurniture, newWidth, selectedFurniture.height, newDepth);
      const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === resizingItemId ? recalculated : f));
      onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
      return;
    }

    // Dragging Furniture with Intelligent Snapping (OSNAP)
    if (draggingItemId) {
      const targetItem = activeRoom.furniture.find((f) => f.id === draggingItemId);
      if (!targetItem) return;

      const rawTargetX = worldPos.x - dragOffset.x;
      const rawTargetY = worldPos.y - dragOffset.y;

      const snapResult = calculateIntelligentSnapping(targetItem, rawTargetX, rawTargetY, activeRoom, 25, 70);

      setActiveGuides(snapResult.guideLines);
      setActiveSnapBadge(snapResult.snapBadge || null);
      setAlignedItemIds(snapResult.alignedItemIds || []);

      const updatedFurnitureList = activeRoom.furniture.map((f) => {
        if (f.id === draggingItemId) {
          return {
            ...f,
            x: snapResult.snappedX,
            y: snapResult.snappedY,
          };
        }
        return f;
      });

      onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
    }
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingItemId(null);
    setResizingItemId(null);
    setActiveResizeHandle(null);
    setInitialResizeBox(null);
    setLiveResizeDimension(null);
    setActiveGuides([]);
    setActiveSnapBadge(null);
    setAlignedItemIds([]);
  };

  // Zoom on Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.05, Math.min(1.5, zoom * zoomFactor));

    // Keep mouse pointer centered during zoom
    const newPanX = mouseScreenX - (mouseScreenX - pan.x) * (newZoom / zoom);
    const newPanY = mouseScreenY - (mouseScreenY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Rotate Selected Furniture
  const handleRotateSelected = () => {
    if (!selectedFurniture) return;
    const newRotation = (selectedFurniture.rotation + 90) % 360;
    // Swap width and depth visually
    const updated = {
      ...selectedFurniture,
      rotation: newRotation,
    };
    const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? updated : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
  };

  // Duplicate Selected Furniture
  const handleDuplicateSelected = () => {
    if (!selectedFurniture) return;
    const newItem: FurnitureItem = {
      ...selectedFurniture,
      id: `f_${Date.now()}`,
      name: `${selectedFurniture.name} (Copy)`,
      x: selectedFurniture.x + selectedFurniture.width + 100,
      y: selectedFurniture.y,
    };
    onUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    onSelectFurniture(newItem.id);
  };

  // Delete Selected Furniture
  const handleDeleteSelected = () => {
    if (!selectedFurniture) return;
    const updatedFurnitureList = activeRoom.furniture.filter((f) => f.id !== selectedFurniture.id);
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
    onSelectFurniture(null);
  };

  // Mirror Selected Furniture
  const handleMirrorSelected = (direction: 'horizontal' | 'vertical') => {
    if (!selectedFurniture) return;
    const mirrored = mirrorFurnitureItem(selectedFurniture, direction);
    const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? mirrored : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
  };

  // Quick Parametric Shutter / Shelf / Drawer handlers for Selected Furniture
  const handleQuickShutterChange = (delta: number) => {
    if (!selectedFurniture) return;
    const current = selectedFurniture.parametric.shutterCount || 1;
    const newCount = Math.max(1, Math.min(6, current + delta));
    const updated = {
      ...selectedFurniture,
      parametric: {
        ...selectedFurniture.parametric,
        shutterCount: newCount,
      },
    };
    const recalculated = recalculateParametricFurniture(updated);
    const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? recalculated : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
  };

  const handleQuickShelfChange = (delta: number) => {
    if (!selectedFurniture) return;
    const current = selectedFurniture.parametric.shelfCount || 0;
    const newCount = Math.max(0, Math.min(8, current + delta));
    const updated = {
      ...selectedFurniture,
      parametric: {
        ...selectedFurniture.parametric,
        shelfCount: newCount,
      },
    };
    const recalculated = recalculateParametricFurniture(updated);
    const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? recalculated : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
  };

  const handleQuickDrawerChange = (delta: number) => {
    if (!selectedFurniture) return;
    const current = selectedFurniture.parametric.drawerCount || 0;
    const newCount = Math.max(0, Math.min(6, current + delta));
    const updated = {
      ...selectedFurniture,
      parametric: {
        ...selectedFurniture.parametric,
        drawerCount: newCount,
      },
    };
    const recalculated = recalculateParametricFurniture(updated);
    const updatedFurnitureList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? recalculated : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedFurnitureList });
  };

  // Keyboard Shortcuts (Escape to disconnect tool, Delete to remove, M to mirror, Zoom, Auto-Dim)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        // Disconnect tool
        setWallStart(null);
        setMeasureStart(null);
        setMeasureCurrent(null);
        onToolChange('SELECT');
        onSelectFurniture(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (project.selectedFurnitureId) {
          handleDeleteSelected();
        }
      } else if ((e.key === 'h' || e.key === 'H') && e.shiftKey) {
        if (project.selectedFurnitureId) {
          handleMirrorSelected('horizontal');
        }
      } else if ((e.key === 'v' || e.key === 'V') && e.shiftKey) {
        if (project.selectedFurnitureId) {
          handleMirrorSelected('vertical');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (project.selectedFurnitureId) {
          handleRotateSelected();
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleZoomToFit();
      } else if (e.key === 'a' || e.key === 'A') {
        setShowAutoDimensions((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.selectedFurnitureId, activeRoom, selectedFurniture, handleZoomIn, handleZoomOut, handleZoomToFit]);

  // Context Menu / Right Click to Disconnect Tool
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // If any active drawing/measuring/inserting tool is active, disconnect and return to SELECT
    if (activeTool === 'WALL') {
      setWallStart(null);
      onToolChange('SELECT');
      return;
    }
    if (activeTool === 'MEASURE') {
      setMeasureStart(null);
      setMeasureCurrent(null);
      onToolChange('SELECT');
      return;
    }
    if (activeTool !== 'SELECT') {
      onToolChange('SELECT');
      return;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#1e1e1e] select-none">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />

      {/* Active Tool Notification & Right-click disconnect hint */}
      {activeTool !== 'SELECT' && activeTool !== 'PAN' && (
        <div className="absolute top-4 left-4 bg-[#252526] border border-[#3b82f6aa] text-gray-200 px-3 py-1.5 rounded shadow-lg flex items-center gap-2 z-20 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Active: <strong className="text-blue-400">{activeTool}</strong></span>
          <span className="text-gray-400 text-[11px] border-l border-[#444] pl-2">
            Right-click or [Esc] to <span className="text-amber-400 font-semibold">Disconnect</span>
          </span>
          <button
            onClick={() => {
              setWallStart(null);
              setMeasureStart(null);
              setMeasureCurrent(null);
              onToolChange('SELECT');
            }}
            className="ml-1 text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#333]"
            title="Disconnect Tool"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Parametric Resizing Live Callout Banner */}
      {liveResizeDimension && selectedFurniture && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded shadow-lg font-mono text-xs font-semibold flex items-center gap-2 border border-blue-400 animate-pulse pointer-events-none z-20">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>
            {liveResizeDimension.label}: ←── <span className="text-white underline font-bold">{liveResizeDimension.value} mm</span> ──→ (Parametric auto-recalculated)
          </span>
        </div>
      )}

      {/* Toast Notification Banner */}
      {dimBakeToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-4 py-1.5 rounded shadow-2xl font-mono text-xs font-semibold flex items-center gap-2 border border-emerald-400 z-30 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{dimBakeToast}</span>
        </div>
      )}

      {/* Top Floating Viewport & Auto-Dimension Navigation Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20 flex-wrap justify-end">
        {/* Real-Time Collision Status & Fast Cycle Pill */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-lg">
          <button
            onClick={() => setShowCollisionHighlights((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              showCollisionHighlights
                ? collisionReport.totalCollisions > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Visual Collision Detection & Real-time Overlap Warnings"
          >
            {collisionReport.totalCollisions > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Collisions:</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.2 rounded-full text-[10px] ${
                collisionReport.totalCollisions > 0
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {collisionReport.totalCollisions}
            </span>
          </button>

          {/* Jump to Next Conflict Button */}
          {collisionReport.totalCollisions > 0 && (
            <button
              onClick={handleSelectNextConflict}
              className="flex items-center gap-1 px-1.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
              title="Select next conflicting or out-of-bounds furniture item"
            >
              <AlertTriangle className="w-3 h-3 text-amber-200" />
              <span>Next Clash</span>
            </button>
          )}

          {/* Quick Auto-Fix Bounds Button */}
          {collisionReport.outOfBoundsCount > 0 && (
            <button
              onClick={handleAutoFixAllBounds}
              className="flex items-center gap-1 px-1.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
              title="Automatically clamp all out-of-bounds furniture inside room boundary walls"
            >
              <span>Fit All Bounds</span>
            </button>
          )}
        </div>

        {/* Clear 2D Layout Canvas Data Button */}
        {onOpenClearModal && (
          <button
            onClick={onOpenClearModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 shadow-lg text-xs font-bold transition-all cursor-pointer"
            title="Clear 2D Layout Canvas Data / Reset Furniture or Room"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear 2D Layout</span>
          </button>
        )}

        {/* Shutter & Shelves Detailing Toggle */}
        <button
          onClick={() => setShowShutterShelfDetails((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-lg text-xs font-bold transition-all cursor-pointer ${
            showShutterShelfDetails
              ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle 2D Shutter & Internal Shelf Lines Detailing"
        >
          <LayoutGrid className={`w-3.5 h-3.5 ${showShutterShelfDetails ? 'text-purple-600' : 'text-slate-400'}`} />
          <span>Shutter &amp; Shelves: {showShutterShelfDetails ? 'Detailed' : 'Simple'}</span>
        </button>

        {/* Auto-Dimension Controls Bar */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-lg">
          <button
            onClick={() => setShowAutoDimensions((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              showAutoDimensions
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Live Auto-Dimensions (A) - Shows all Wall & Unit clearances"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showAutoDimensions ? 'text-amber-300' : 'text-blue-600'}`} />
            <span>Auto-Dim</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              showAutoDimensions ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-700'
            }`}>
              {liveAutoDimensions.length}
            </span>
          </button>

          {showAutoDimensions && liveAutoDimensions.length > 0 && (
            <button
              onClick={handleBakeAutoDimensions}
              className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
              title="Save all calculated auto-dimensions permanently into the room CAD drawing"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Bake to CAD</span>
            </button>
          )}
        </div>

        {/* Primary Zoom In / Zoom Out Viewport Toolbar */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-lg text-slate-700 text-xs">
          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-blue-600 hover:text-white rounded font-bold transition-all text-xs border border-slate-200 hover:border-blue-400 cursor-pointer"
            title="Zoom In (+) [Keyboard: + or =]"
          >
            <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold">Zoom In</span>
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-blue-600 hover:text-white rounded font-bold transition-all text-xs border border-slate-200 hover:border-blue-400 cursor-pointer"
            title="Zoom Out (-) [Keyboard: - or _]"
          >
            <ZoomOut className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold">Zoom Out</span>
          </button>

          {/* Quick Zoom Presets */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setZoom(0.1)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                Math.abs(zoom - 0.1) < 0.02 ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom 50%"
            >
              50%
            </button>
            <button
              onClick={() => setZoom(0.2)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                Math.abs(zoom - 0.2) < 0.02 ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom 100%"
            >
              100%
            </button>
            <button
              onClick={() => setZoom(0.3)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                Math.abs(zoom - 0.3) < 0.02 ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom 150%"
            >
              150%
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

          {/* Fit Room to Screen Button */}
          <button
            onClick={handleZoomToFit}
            className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded font-semibold transition-colors text-xs border border-slate-200 cursor-pointer"
            title="Zoom to Fit Entire Room (F / 0)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Fit (F)</span>
          </button>
        </div>
      </div>

      {/* Floating Snap Distance Badge */}
      {activeSnapBadge && (
        <div className="absolute top-4 right-16 bg-white text-blue-700 px-3 py-1 rounded shadow-lg border border-blue-200 font-mono text-xs font-semibold flex items-center gap-1.5 pointer-events-none z-20">
          <span>{activeSnapBadge.text}</span>
        </div>
      )}

      {/* Context-Aware Floating Toolbar for Selected Furniture */}
      {selectedFurniture && (
        <FurnitureFloatingToolbar
          furniture={selectedFurniture}
          room={activeRoom}
          collisionInfo={project.selectedFurnitureId ? collisionReport.collisionMap.get(project.selectedFurnitureId) : undefined}
          onUpdateRoom={onUpdateRoom}
          onDeselect={() => onSelectFurniture(null)}
          onDelete={handleDeleteSelected}
          onDuplicate={handleDuplicateSelected}
          onRotate={handleRotateSelected}
          onMirror={(axis) => handleMirrorSelected(axis)}
        />
      )}

      {/* Bottom-Left: CAD Title Block & Live Area Metrics HUD */}
      {(() => {
        const roomMetrics = calculateRoomArea(activeRoom);
        const projectMetrics = calculateProjectArea(project);
        return (
          <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-lg text-slate-800 font-mono text-xs max-w-xs transition-all">
            <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5 font-sans font-bold text-slate-900 text-xs uppercase tracking-wide">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[120px]">{activeRoom.name}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                {roomMetrics.formattedSqFt} sq.ft
              </span>
            </div>

            <div className="pt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
              <div>
                <span className="text-slate-500 block text-[9.5px]">ROOM SIZE:</span>
                <span className="font-semibold text-slate-800">{roomMetrics.widthMm}×{roomMetrics.depthMm} mm</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">METRIC AREA:</span>
                <span className="font-semibold text-slate-800">{roomMetrics.formattedSqM} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">PERIMETER:</span>
                <span className="font-semibold text-slate-800">{roomMetrics.perimeterM} m ({roomMetrics.perimeterFt} ft)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">PROJECT TOTAL:</span>
                <span className="font-bold text-blue-700">{projectMetrics.formattedTotalSqFt} sq.ft</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Canvas Viewport Zoom & HUD Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-lg text-slate-600 text-xs font-mono z-10 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(1.5, z * 1.2))}
          className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="px-1 text-slate-900 font-bold text-[11px]">{Math.round(zoom * 500)}%</span>
        <button
          onClick={() => setZoom((z) => Math.max(0.05, z * 0.8))}
          className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
        <button
          onClick={handleZoomToFit}
          className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Zoom to Fit"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Fit</span>
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
        <span className="text-[10px] text-slate-500 pr-1">
          X: {mouseWorldPos.x} | Y: {mouseWorldPos.y}
        </span>
      </div>
    </div>
  );
};
