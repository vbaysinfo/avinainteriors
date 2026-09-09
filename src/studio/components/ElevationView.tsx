'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProjectInfo, Room, FurnitureItem } from '../types/cad';
import { recalculateParametricFurniture, mirrorFurnitureItem } from '../utils/parametricEngine';
import {
  RotateCw,
  Trash2,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  ArrowLeftRight,
  ArrowUpDown,
  Layers,
  Sparkles,
  Columns,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  EyeOff,
  DoorOpen,
  LayoutGrid,
  Box,
  Palette,
  Ruler,
} from 'lucide-react';

interface ElevationViewProps {
  project: ProjectInfo;
  activeRoom: Room;
  onSelectFurniture: (id: string | null) => void;
  onUpdateRoom: (updatedRoom: Room) => void;
}

type WallFacing = 'wall_a' | 'wall_b' | 'wall_c' | 'wall_d';
type ElevationDisplayMode = 'shutters' | 'carcass' | 'ghosted';

export const ElevationView: React.FC<ElevationViewProps> = ({
  project,
  activeRoom,
  onSelectFurniture,
  onUpdateRoom,
}) => {
  const [selectedWall, setSelectedWall] = useState<WallFacing>('wall_a');
  const [elevationMode, setElevationMode] = useState<ElevationDisplayMode>('shutters');
  const [showSwingLines, setShowSwingLines] = useState<boolean>(false);
  const [showShelfClearances, setShowShelfClearances] = useState<boolean>(true);
  const [filterByWallProximity, setFilterByWallProximity] = useState<boolean>(true);

  // Viewport Transform (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1.0); // 0.35 to 3.5
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanToolActive, setIsPanToolActive] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; itemX: number; itemZ: number }>({
    x: 0,
    y: 0,
    itemX: 0,
    itemZ: 0,
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; initialW: number; initialH: number; initialX: number; initialZ: number }>({
    mouseX: 0,
    mouseY: 0,
    initialW: 0,
    initialH: 0,
    initialX: 0,
    initialZ: 0,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const selectedFurniture = activeRoom.furniture.find((f) => f.id === project.selectedFurnitureId);

  const roomWidth = selectedWall === 'wall_a' || selectedWall === 'wall_c' ? activeRoom.widthMm : activeRoom.depthMm;
  const roomHeight = activeRoom.heightMm || 2900;

  // Zoom Helpers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3.5, +(prev + 0.15).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.35, +(prev - 0.15).toFixed(2)));
  }, []);

  const handleFitView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomPreset = useCallback((targetZoom: number) => {
    setZoom(targetZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard Shortcuts for Elevation View
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      } else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitView();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleZoomIn, handleZoomOut, handleFitView]);

  // Architectural Level Datums
  const levelDatums = [
    { label: 'CEILING LEVEL', mm: roomHeight, color: '#94A3B8' },
    { label: 'LOFT TOP / LINTEL', mm: 2100, color: '#38BDF8' },
    { label: 'WALL UNIT BOTTOM', mm: 1400, color: '#818CF8' },
    { label: 'COUNTERTOP TOP', mm: 860, color: '#34D399' },
    { label: 'SKIRTING LEVEL', mm: 75, color: '#CBD5E1' },
    { label: 'FINISHED FLOOR (FFL)', mm: 0, color: '#F59E0B' },
  ];

  // Filter items that sit on or face the selected wall to prevent stacking clutter
  const wallFurniture = activeRoom.furniture.filter((item) => {
    if (!filterByWallProximity) return true;
    if (selectedWall === 'wall_a') {
      // North Wall (Y near 0)
      return item.y <= 1400;
    }
    if (selectedWall === 'wall_c') {
      // South Wall (Y near activeRoom.depthMm)
      return item.y + item.depth >= activeRoom.depthMm - 1400;
    }
    if (selectedWall === 'wall_b') {
      // East Wall (X near activeRoom.widthMm)
      return item.x + item.width >= activeRoom.widthMm - 1400;
    }
    if (selectedWall === 'wall_d') {
      // West Wall (X near 0)
      return item.x <= 1400;
    }
    return true;
  });

  const sortedFurniture = [...wallFurniture].sort((a, b) => a.x - b.x);

  // Quick parametric updates for selected unit
  const handleUpdateSelectedParametric = (updates: Partial<FurnitureItem['parametric']>) => {
    if (!selectedFurniture) return;
    const updated: FurnitureItem = {
      ...selectedFurniture,
      parametric: {
        ...selectedFurniture.parametric,
        ...updates,
      },
    };
    const recalculated = recalculateParametricFurniture(updated);
    const updatedList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? recalculated : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedList });
  };

  // Mirror handler in Front View
  const handleMirror = (direction: 'horizontal' | 'vertical') => {
    if (!selectedFurniture) return;
    const mirrored = mirrorFurnitureItem(selectedFurniture, direction);
    const updatedList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? mirrored : f));
    onUpdateRoom({ ...activeRoom, furniture: updatedList });
  };

  // Duplicate handler
  const handleDuplicate = () => {
    if (!selectedFurniture) return;
    const newItem: FurnitureItem = {
      ...selectedFurniture,
      id: `f_${Date.now()}`,
      name: `${selectedFurniture.name} (Copy)`,
      x: Math.min(roomWidth - selectedFurniture.width - 50, selectedFurniture.x + selectedFurniture.width + 50),
    };
    onUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    onSelectFurniture(newItem.id);
  };

  // Delete handler
  const handleDelete = () => {
    if (!selectedFurniture) return;
    const updatedList = activeRoom.furniture.filter((f) => f.id !== selectedFurniture.id);
    onUpdateRoom({ ...activeRoom, furniture: updatedList });
    onSelectFurniture(null);
  };

  // Quick Add Standard Unit into Front View
  const handleQuickAdd = (type: 'base' | 'wall' | 'wardrobe' | 'loft') => {
    const lastX = sortedFurniture.length > 0 ? sortedFurniture[sortedFurniture.length - 1].x + sortedFurniture[sortedFurniture.length - 1].width + 20 : 200;
    const posX = Math.min(Math.max(100, lastX), roomWidth - 900);

    let newItem: FurnitureItem;
    if (type === 'base') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'kitchen_base_2shutter',
        category: 'kitchen',
        name: 'Modular Base Cabinet (2-Door)',
        x: posX,
        y: 100,
        z: 0,
        width: 800,
        height: 860,
        depth: 600,
        rotation: 0,
        parametric: {
          carcassThickness: 18,
          backPlyThickness: 9,
          shutterCount: 2,
          shutterType: 'hinged',
          shutterFinish: 'Acrylic High Gloss',
          shutterColor: '#FAFAFA',
          handleType: 'g_profile',
          drawerCount: 0,
          shelfCount: 1,
          hasLoft: false,
          loftHeight: 0,
          hasCountertop: true,
          countertopThickness: 20,
          countertopOverhang: 25,
          countertopMaterial: 'Quartz Calacatta Gold',
          skirtingHeight: 75,
          hingesCount: 4,
          slidePairs: 0,
          handlesCount: 2,
          legsCount: 4,
        },
        materials: {
          carcassMaterial: '18mm BWP Plywood',
          carcassFinish: 'Frosty White',
          shutterMaterial: 'Acrylic High Gloss',
          shutterFinish: 'Ultra White',
          shutterColor: '#FAFAFA',
          counterMaterial: 'Quartz Calacatta Gold',
        },
      };
    } else if (type === 'wall') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'kitchen_wall_2door',
        category: 'kitchen',
        name: 'Overhead Wall Cabinet (2-Door)',
        x: posX,
        y: 100,
        z: 1400,
        width: 800,
        height: 700,
        depth: 350,
        rotation: 0,
        parametric: {
          carcassThickness: 18,
          backPlyThickness: 9,
          shutterCount: 2,
          shutterType: 'hinged',
          shutterFinish: 'Acrylic High Gloss',
          shutterColor: '#FAFAFA',
          handleType: 'g_profile',
          drawerCount: 0,
          shelfCount: 2,
          hasLoft: false,
          loftHeight: 0,
          hasCountertop: false,
          countertopThickness: 0,
          countertopOverhang: 0,
          countertopMaterial: '',
          skirtingHeight: 0,
          hingesCount: 4,
          slidePairs: 0,
          handlesCount: 2,
          legsCount: 0,
        },
        materials: {
          carcassMaterial: '18mm BWP Plywood',
          carcassFinish: 'Frosty White',
          shutterMaterial: 'Acrylic High Gloss',
          shutterFinish: 'Ultra White',
          shutterColor: '#FAFAFA',
          counterMaterial: '',
        },
      };
    } else if (type === 'wardrobe') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'wardrobe_3door',
        category: 'wardrobe',
        name: '3-Door Hinged Wardrobe',
        x: posX,
        y: 100,
        z: 0,
        width: 1350,
        height: 2100,
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
          loftHeight: 800,
          hasCountertop: false,
          countertopThickness: 0,
          countertopOverhang: 0,
          countertopMaterial: '',
          skirtingHeight: 75,
          hingesCount: 9,
          slidePairs: 2,
          handlesCount: 5,
          legsCount: 4,
        },
        materials: {
          carcassMaterial: '18mm BWP Plywood',
          carcassFinish: 'Frosty White',
          shutterMaterial: 'Acrylic High Gloss',
          shutterFinish: 'Ultra White',
          shutterColor: '#FAFAFA',
          counterMaterial: '',
        },
      };
    } else {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'kitchen_loft_unit',
        category: 'kitchen',
        name: 'Top Loft Storage Module',
        x: posX,
        y: 100,
        z: 2100,
        width: 800,
        height: 800,
        depth: 600,
        rotation: 0,
        parametric: {
          carcassThickness: 18,
          backPlyThickness: 9,
          shutterCount: 2,
          shutterType: 'hinged',
          shutterFinish: 'Acrylic High Gloss',
          shutterColor: '#FAFAFA',
          handleType: 'push_to_open',
          drawerCount: 0,
          shelfCount: 1,
          hasLoft: false,
          loftHeight: 0,
          hasCountertop: false,
          countertopThickness: 0,
          countertopOverhang: 0,
          countertopMaterial: '',
          skirtingHeight: 0,
          hingesCount: 4,
          slidePairs: 0,
          handlesCount: 2,
          legsCount: 0,
        },
        materials: {
          carcassMaterial: '18mm BWP Plywood',
          carcassFinish: 'Frosty White',
          shutterMaterial: 'Acrylic High Gloss',
          shutterFinish: 'Ultra White',
          shutterColor: '#FAFAFA',
          counterMaterial: '',
        },
      };
    }

    onUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    onSelectFurniture(newItem.id);
  };

  // Dragging Furniture in Front Elevation View
  const handleItemMouseDown = (e: React.MouseEvent, item: FurnitureItem) => {
    if (isPanToolActive || isSpacePressed) return;
    e.stopPropagation();
    onSelectFurniture(item.id);
    setIsDragging(true);
    setDragItemId(item.id);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      itemX: item.x,
      itemZ: item.z || 0,
    });
  };

  // Resizing Handle Mouse Down in Front Elevation View
  const handleResizeMouseDown = (e: React.MouseEvent, item: FurnitureItem, handle: 'left' | 'right' | 'top' | 'bottom') => {
    if (isPanToolActive || isSpacePressed) return;
    e.stopPropagation();
    onSelectFurniture(item.id);
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialW: item.width,
      initialH: item.height,
      initialX: item.x,
      initialZ: item.z || 0,
    });
  };

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isPanToolActive || isSpacePressed || e.target === viewportRef.current) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const stageWidthPx = stageRect.width;
    const stageHeightPx = stageRect.height;

    // mm per pixel conversion scaled with current zoom
    const effectiveZoom = Math.max(0.2, zoom);
    const mmPerPxX = (roomWidth / stageWidthPx) / effectiveZoom;
    const mmPerPxY = (roomHeight / stageHeightPx) / effectiveZoom;

    if (isDragging && dragItemId) {
      const deltaX = (e.clientX - dragStartPos.x) * mmPerPxX;
      const deltaY = (dragStartPos.y - e.clientY) * mmPerPxY; // inverted Y for Z elevation

      let newX = Math.round((dragStartPos.itemX + deltaX) / 25) * 25; // 25mm grid snap
      let newZ = Math.round((dragStartPos.itemZ + deltaY) / 25) * 25;

      // Bound checks
      const item = activeRoom.furniture.find((f) => f.id === dragItemId);
      if (item) {
        newX = Math.max(0, Math.min(roomWidth - item.width, newX));
        newZ = Math.max(0, Math.min(roomHeight - item.height, newZ));

        // Intelligent Z snap to level datums (FFL 0, Countertop 860, Wall Unit 1400, Lintel 2100)
        levelDatums.forEach((datum) => {
          if (Math.abs(newZ - datum.mm) < 35) {
            newZ = datum.mm;
          }
        });

        const updated = { ...item, x: newX, z: newZ };
        const updatedList = activeRoom.furniture.map((f) => (f.id === dragItemId ? updated : f));
        onUpdateRoom({ ...activeRoom, furniture: updatedList });
      }
    } else if (isResizing && selectedFurniture && resizeHandle) {
      const deltaMmX = (e.clientX - resizeStart.mouseX) * mmPerPxX;
      const deltaMmY = (resizeStart.mouseY - e.clientY) * mmPerPxY;

      let newW = resizeStart.initialW;
      let newH = resizeStart.initialH;
      let newX = resizeStart.initialX;
      let newZ = resizeStart.initialZ;

      if (resizeHandle === 'right') {
        newW = Math.max(200, Math.min(roomWidth - newX, Math.round((resizeStart.initialW + deltaMmX) / 50) * 50));
      } else if (resizeHandle === 'left') {
        const proposedW = Math.round((resizeStart.initialW - deltaMmX) / 50) * 50;
        if (proposedW >= 200) {
          newW = proposedW;
          newX = Math.max(0, resizeStart.initialX + (resizeStart.initialW - proposedW));
        }
      } else if (resizeHandle === 'top') {
        newH = Math.max(300, Math.min(roomHeight - newZ, Math.round((resizeStart.initialH + deltaMmY) / 50) * 50));
      } else if (resizeHandle === 'bottom') {
        const proposedH = Math.round((resizeStart.initialH - deltaMmY) / 50) * 50;
        if (proposedH >= 300) {
          newH = proposedH;
          newZ = Math.max(0, resizeStart.initialZ + (resizeStart.initialH - proposedH));
        }
      }

      const recalculated = recalculateParametricFurniture({
        ...selectedFurniture,
        x: newX,
        z: newZ,
      }, newW, newH, selectedFurniture.depth);

      const updatedList = activeRoom.furniture.map((f) => (f.id === selectedFurniture.id ? recalculated : f));
      onUpdateRoom({ ...activeRoom, furniture: updatedList });
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setDragItemId(null);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.max(0.35, Math.min(3.5, +(prev * zoomFactor).toFixed(2))));
  };

  return (
    <div
      className={`w-full h-full bg-slate-100 flex flex-col overflow-hidden select-none text-slate-800 ${
        isPanning ? 'cursor-grabbing' : isPanToolActive || isSpacePressed ? 'cursor-grab' : 'cursor-default'
      }`}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseUp}
      onWheel={handleWheel}
    >
      {/* Elevation Main Header / Toolbar */}
      <div className="h-12 border-b px-4 flex items-center justify-between z-30 flex-shrink-0 bg-white border-slate-200 text-slate-800 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Wall Selection Tabs */}
          <div className="flex items-center p-0.5 rounded-lg border text-xs bg-slate-100 border-slate-200">
            <button
              onClick={() => {
                setSelectedWall('wall_a');
                handleFitView();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                selectedWall === 'wall_a'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Wall A (North)
            </button>
            <button
              onClick={() => {
                setSelectedWall('wall_b');
                handleFitView();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                selectedWall === 'wall_b'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Wall B (East)
            </button>
            <button
              onClick={() => {
                setSelectedWall('wall_c');
                handleFitView();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                selectedWall === 'wall_c'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Wall C (South)
            </button>
            <button
              onClick={() => {
                setSelectedWall('wall_d');
                handleFitView();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                selectedWall === 'wall_d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Wall D (West)
            </button>
          </div>

          {/* Shutter & Shelves Detail Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border text-xs bg-blue-50/60 border-blue-200">
            <button
              onClick={() => setElevationMode('shutters')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                elevationMode === 'shutters'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-800 hover:bg-blue-100'
              }`}
              title="Show clean exterior shutter facades with handles and finishes"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Shutters View</span>
            </button>

            <button
              onClick={() => setElevationMode('carcass')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                elevationMode === 'carcass'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-100'
              }`}
              title="Show internal carcass, horizontal shelves, hanging rods, and drawers"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Shelves &amp; Carcass</span>
            </button>

            <button
              onClick={() => setElevationMode('ghosted')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                elevationMode === 'ghosted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Show translucent shutters overlaying internal shelves (X-Ray view)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>X-Ray Dual</span>
            </button>
          </div>
        </div>

        {/* Header Right: Clutter Toggles & Quick Add */}
        <div className="flex items-center gap-2">
          {/* Swing Lines Toggle */}
          <button
            onClick={() => setShowSwingLines(!showSwingLines)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showSwingLines
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle architectural door swing lines"
          >
            {showSwingLines ? <Eye className="w-3 h-3 text-amber-700" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            <span>Swing Lines: {showSwingLines ? 'ON' : 'OFF'}</span>
          </button>

          {/* Shelf Heights Toggle */}
          {elevationMode !== 'shutters' && (
            <button
              onClick={() => setShowShelfClearances(!showShelfClearances)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showShelfClearances
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle shelf height clearance annotations (mm)"
            >
              <Ruler className="w-3 h-3 text-purple-600" />
              <span>Shelf mm</span>
            </button>
          )}

          {/* Filter by Proximity */}
          <button
            onClick={() => setFilterByWallProximity(!filterByWallProximity)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              filterByWallProximity
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Filter furniture to only items attached to this wall (prevents clutter)"
          >
            <span>{filterByWallProximity ? 'Wall Items Only' : 'All Room Items'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1" />

          {/* Quick Add Modular Units */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickAdd('wardrobe')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 cursor-pointer"
              title="Add 3-Door Tall Wardrobe"
            >
              <Plus className="w-3 h-3 text-purple-600" />
              <span>+ Wardrobe</span>
            </button>
            <button
              onClick={() => handleQuickAdd('base')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 cursor-pointer"
              title="Add Modular Base Cabinet"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>+ Base</span>
            </button>
            <button
              onClick={() => handleQuickAdd('wall')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 cursor-pointer"
              title="Add Overhead Wall Unit"
            >
              <Plus className="w-3 h-3 text-sky-600" />
              <span>+ Wall Unit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Elevation Graphic Viewport */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden p-4 sm:p-8 flex items-center justify-center relative bg-slate-100/90"
      >
        {/* Floating Zoom & View Controls Toolbar */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md bg-white/95 border-slate-200 text-slate-700">
          <button
            onClick={() => setIsPanToolActive(!isPanToolActive)}
            className={`p-1.5 rounded-lg transition-all ${
              isPanToolActive
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Pan View Tool (or hold Space / Middle Mouse)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 mx-1 bg-slate-200" />

          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom Out ( - )"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFitView}
            className="font-mono text-xs font-bold px-2 py-0.5 rounded border transition-colors bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
            title="Click to Reset Zoom ( 100% )"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom In ( + )"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 mx-1 bg-slate-200" />

          <button
            onClick={handleFitView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer"
            title="Fit to Screen [F / 0]"
          >
            <Maximize2 className="w-3 h-3 text-amber-500" />
            <span>Fit (F)</span>
          </button>
        </div>

        {/* Zoomable & Pannable Stage Container */}
        <div
          className="relative transition-transform duration-75 origin-center will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div className="relative rounded-2xl shadow-2xl p-8 min-w-[960px] max-w-[1300px] w-full border bg-white border-slate-300">
            {/* Level Markers on Left */}
            <div className="absolute left-2 top-8 bottom-8 w-32 flex flex-col justify-between pointer-events-none z-10">
              {levelDatums.map((lvl) => {
                const bottomPercent = (lvl.mm / roomHeight) * 100;
                return (
                  <div
                    key={lvl.label}
                    className="absolute left-0 -translate-y-1/2 flex items-center gap-1.5 font-mono text-[10px]"
                    style={{ bottom: `${bottomPercent}%` }}
                  >
                    <span className="font-bold whitespace-nowrap px-1.5 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300 shadow-xs">
                      +{lvl.mm}
                    </span>
                    <div className="w-3 h-0.5" style={{ backgroundColor: lvl.color }} />
                  </div>
                );
              })}
            </div>

            {/* Elevation Stage Box */}
            <div
              ref={stageRef}
              className="relative w-full h-[480px] border-b-4 border-amber-600 border-t border-l border-r rounded-lg overflow-hidden ml-16 select-none bg-slate-50 border-slate-300 shadow-inner"
              onClick={(e) => {
                if (e.target === stageRef.current) {
                  onSelectFurniture(null);
                }
              }}
            >
              {/* Ceiling Hatch */}
              <div className="absolute top-0 left-0 right-0 h-6 border-b flex items-center justify-center bg-slate-200/80 border-slate-300">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-600">
                  RCC Ceiling Slab — +{roomHeight} mm
                </span>
              </div>

              {/* Datum Grid Horizontal Lines */}
              {levelDatums.map((lvl) => {
                const bottomPercent = (lvl.mm / roomHeight) * 100;
                return (
                  <div
                    key={lvl.label}
                    className="absolute left-0 right-0 border-b border-dashed flex items-center justify-end pr-2 pointer-events-none"
                    style={{
                      bottom: `${bottomPercent}%`,
                      borderColor: `${lvl.color}40`,
                    }}
                  >
                    <span
                      className="text-[9px] font-mono uppercase tracking-wider font-semibold opacity-70"
                      style={{ color: lvl.color }}
                    >
                      {lvl.label} (+{lvl.mm})
                    </span>
                  </div>
                );
              })}

              {/* Wall Openings (Doors / Windows on this wall) */}
              {activeRoom.doors.map((d) => (
                <div
                  key={d.id}
                  style={{
                    left: `${(d.x / roomWidth) * 100}%`,
                    width: `${(d.width / roomWidth) * 100}%`,
                    bottom: 0,
                    height: `${(d.height / roomHeight) * 100}%`,
                  }}
                  className="absolute border-2 border-dashed border-amber-500 bg-amber-500/10 flex flex-col justify-between p-2 pointer-events-none z-5"
                >
                  <div className="bg-amber-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs self-center">
                    Door ({d.width} × {d.height} mm)
                  </div>
                  <div className="w-1.5 h-6 bg-amber-600 rounded self-start" />
                </div>
              ))}

              {activeRoom.windows.map((w) => (
                <div
                  key={w.id}
                  style={{
                    left: `${(w.x / roomWidth) * 100}%`,
                    width: `${(w.width / roomWidth) * 100}%`,
                    bottom: `${((w.sillHeight || 900) / roomHeight) * 100}%`,
                    height: `${(w.height / roomHeight) * 100}%`,
                  }}
                  className="absolute border-2 border-sky-500 bg-sky-500/10 flex flex-col justify-between p-1.5 pointer-events-none z-5"
                >
                  <span className="text-[9px] text-sky-900 font-mono font-bold bg-sky-100 px-2 py-0.5 rounded border border-sky-300 self-center shadow-xs">
                    Window ({w.width} × {w.height} mm)
                  </span>
                  <div className="border-t border-sky-400/50 w-full" />
                </div>
              ))}

              {/* Furniture Elevations (Parametric Shutters, Shelves, and Carcass) */}
              {sortedFurniture.map((item) => {
                const isSelected = item.id === project.selectedFurnitureId;
                const leftPercent = (item.x / roomWidth) * 100;
                const widthPercent = (item.width / roomWidth) * 100;
                const bottomPercent = ((item.z || 0) / roomHeight) * 100;
                const heightPercent = (item.height / roomHeight) * 100;

                const shutterCount = item.parametric.shutterCount || 1;
                const shelfCount = item.parametric.shelfCount !== undefined ? item.parametric.shelfCount : 3;
                const drawerCount = item.parametric.drawerCount || 0;
                const hasLoft = item.parametric.hasLoft && (item.parametric.loftHeight || 0) > 0;
                const loftHeightMm = item.parametric.loftHeight || 0;
                const skirtingHeight = item.parametric.skirtingHeight || 0;

                const isWardrobe = item.category === 'wardrobe' || item.catalogId.includes('wardrobe');
                const isKitchen = item.category === 'kitchen' || item.catalogId.includes('kitchen');

                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFurniture(item.id);
                    }}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      bottom: `${bottomPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    className={`absolute cursor-pointer group rounded-sm border transition-all ${
                      isSelected
                        ? 'border-blue-600 shadow-xl ring-2 ring-blue-500/40 z-20'
                        : 'border-slate-400 bg-white hover:border-blue-500 hover:shadow-md z-10'
                    }`}
                  >
                    {/* Top Loft Section if enabled */}
                    {hasLoft && (
                      <div
                        className="absolute left-0 right-0 border-2 border-b-0 rounded-t-sm flex flex-col justify-between p-1 bg-purple-50/90 border-purple-400"
                        style={{
                          top: `-${(loftHeightMm / item.height) * 100}%`,
                          height: `${(loftHeightMm / item.height) * 100}%`,
                        }}
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-mono font-bold text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300">
                            LOFT {loftHeightMm}mm
                          </span>
                        </div>
                        {/* Loft Shutters Division */}
                        {shutterCount > 1 && (
                          <div className="w-full flex divide-x divide-purple-300 h-full mt-0.5">
                            {Array.from({ length: shutterCount }).map((_, idx) => (
                              <div key={idx} className="flex-1 flex items-center justify-center">
                                <div className="w-1 h-3 rounded-full bg-purple-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skirting Plinth Base */}
                    {skirtingHeight > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 border-t flex items-center justify-between px-2 pointer-events-none bg-slate-200 border-slate-300 z-10"
                        style={{ height: `${(skirtingHeight / item.height) * 100}%` }}
                      >
                        <span className="text-[8px] font-mono font-bold text-slate-600">
                          Skirting {skirtingHeight}mm
                        </span>
                        <div className="flex gap-4">
                          <div className="w-3 h-1.5 bg-slate-400 rounded-xs" />
                          <div className="w-3 h-1.5 bg-slate-400 rounded-xs" />
                        </div>
                      </div>
                    )}

                    {/* Countertop Slab if Kitchen Base */}
                    {item.parametric.hasCountertop && (
                      <div className="absolute -top-3 -left-1 -right-1 h-3 bg-stone-200 border border-stone-400 rounded-xs shadow-xs flex items-center justify-center z-20 pointer-events-none">
                        <span className="text-[8px] text-stone-900 font-bold font-mono">
                          Quartz Top 20mm
                        </span>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* VIEW 1: INTERNAL CARCASS & SHELVES MODE (Section View)   */}
                    {/* ======================================================== */}
                    {(elevationMode === 'carcass' || elevationMode === 'ghosted') && (
                      <div className={`absolute inset-0 flex flex-col pointer-events-none ${
                        elevationMode === 'ghosted' ? 'opacity-40' : 'bg-amber-50/30'
                      }`}>
                        {/* 18mm Carcass Outer Frame Indicator */}
                        <div className="absolute inset-0 border-[3px] border-amber-800/30" />

                        {/* Internal Vertical Dividers */}
                        <div className="absolute inset-0 flex divide-x-[3px] divide-amber-800/30">
                          {Array.from({ length: Math.max(1, shutterCount) }).map((_, bayIdx) => {
                            const bayShelves = shelfCount;
                            const hasDrawers = isWardrobe && drawerCount > 0 && bayIdx === 0;
                            const hasHangingRod = isWardrobe && bayIdx > 0;

                            return (
                              <div key={bayIdx} className="flex-1 flex flex-col justify-between relative p-1">
                                {/* Top Shelf Compartment */}
                                <div className="border-b-[3px] border-amber-800/40 pb-1 flex justify-between items-center">
                                  <span className="text-[8px] font-mono text-amber-900 font-bold">Top Shelf</span>
                                  {showShelfClearances && (
                                    <span className="text-[8px] font-mono text-purple-700 bg-purple-50 px-1 rounded">350mm</span>
                                  )}
                                </div>

                                {/* Middle Section: Shelves OR Hanging Section */}
                                {hasHangingRod ? (
                                  <div className="flex-1 flex flex-col items-center justify-start pt-3 relative">
                                    {/* Chrome Hanging Rod */}
                                    <div className="w-[90%] h-1.5 bg-slate-400 rounded-full border border-slate-500 shadow-xs flex items-center justify-around">
                                      {/* Clothes Hanger Icons */}
                                      <div className="w-3 h-4 border-t-2 border-slate-700 rounded-t-full -mt-2 opacity-60" />
                                      <div className="w-3 h-4 border-t-2 border-slate-700 rounded-t-full -mt-2 opacity-60" />
                                    </div>
                                    <span className="text-[8px] font-mono font-bold text-slate-500 mt-2 bg-white/80 px-1 rounded border border-slate-200">
                                      Hanging Section (950mm)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex flex-col justify-around py-1">
                                    {Array.from({ length: Math.max(1, bayShelves) }).map((_, sIdx) => (
                                      <div key={sIdx} className="w-full flex flex-col">
                                        <div className="w-full h-[3px] bg-amber-800/40 rounded-full" />
                                        {showShelfClearances && (
                                          <span className="text-[7.5px] font-mono text-slate-500 self-end mr-1">
                                            {Math.round((item.height - (skirtingHeight || 0)) / (bayShelves + 1))}mm
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Bottom Section: Drawers Bank if present */}
                                {hasDrawers && (
                                  <div className="border-t-[3px] border-amber-800/40 pt-1 flex flex-col gap-1 bg-amber-100/40 rounded-b">
                                    {Array.from({ length: drawerCount }).map((_, dIdx) => (
                                      <div key={dIdx} className="h-6 border border-amber-300 bg-white/90 rounded-xs flex items-center justify-between px-2 shadow-xs">
                                        <span className="text-[8px] font-mono font-bold text-amber-900">Drawer {dIdx + 1}</span>
                                        <div className="w-6 h-1 bg-amber-600 rounded-full" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* VIEW 2: SHUTTERS FACADE (Exterior View)                  */}
                    {/* ======================================================== */}
                    {(elevationMode === 'shutters' || elevationMode === 'ghosted') && (
                      <div className={`absolute inset-0 flex divide-x divide-slate-300 pointer-events-none ${
                        elevationMode === 'ghosted' ? 'bg-blue-50/20' : 'bg-slate-50'
                      }`}>
                        {Array.from({ length: shutterCount }).map((_, sIdx) => {
                          const isEven = sIdx % 2 === 0;
                          return (
                            <div
                              key={sIdx}
                              className="flex-1 flex flex-col justify-between p-2 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors"
                            >
                              {/* Shutter Shadow Gap Reveal */}
                              <div className="absolute inset-0.5 border border-slate-200/80 rounded-xs" />

                              {/* Subtle Optional Hinge Swing Lines (Architectural Elevation Symbol) */}
                              {showSwingLines && (
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none opacity-25 text-slate-600"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 100 100"
                                >
                                  {isEven ? (
                                    <polygon
                                      points="0,0 100,50 0,100"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeDasharray="4 3"
                                      strokeWidth="1.2"
                                    />
                                  ) : (
                                    <polygon
                                      points="100,0 0,50 100,100"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeDasharray="4 3"
                                      strokeWidth="1.2"
                                    />
                                  )}
                                </svg>
                              )}

                              {/* Texture overlays based on shutter type */}
                              {item.parametric.shutterType === 'fluted' && (
                                <div className="absolute inset-1 opacity-25 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_8px)]" />
                              )}
                              {item.parametric.shutterType === 'glass' && (
                                <div className="absolute inset-1 border border-sky-300 bg-sky-100/30 rounded-xs" />
                              )}

                              {/* Clean Shutter Handle */}
                              {item.parametric.handleType !== 'push_to_open' && (
                                <div
                                  className={`w-1.5 h-8 rounded-full shadow-sm z-10 my-auto ${
                                    isEven ? 'self-end mr-0.5' : 'self-start ml-0.5'
                                  } ${
                                    item.parametric.handleType === 'edge_lip'
                                      ? 'bg-amber-600'
                                      : 'bg-slate-700'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Unit Info Badge (Clean, Floating Top Tag) */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-white/95 border border-slate-200 text-slate-900 shadow-xs truncate max-w-[160px]">
                        {item.name.split(' (')[0]}
                      </span>
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100/95 text-blue-900 border border-blue-300 shadow-xs">
                        {item.width} × {item.height}
                      </span>
                    </div>

                    {/* Interactive Resize Handles when Selected */}
                    {isSelected && (
                      <>
                        {/* Left handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, item, 'left')}
                          className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-9 bg-blue-600 border-2 border-white rounded-md cursor-ew-resize flex items-center justify-center z-30 shadow-lg hover:scale-110 transition-transform"
                          title="Drag to Resize Width"
                        >
                          <div className="w-0.5 h-3.5 bg-white" />
                        </div>

                        {/* Right handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, item, 'right')}
                          className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-9 bg-blue-600 border-2 border-white rounded-md cursor-ew-resize flex items-center justify-center z-30 shadow-lg hover:scale-110 transition-transform"
                          title="Drag to Resize Width"
                        >
                          <div className="w-0.5 h-3.5 bg-white" />
                        </div>

                        {/* Top handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, item, 'top')}
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-9 h-5 bg-blue-600 border-2 border-white rounded-md cursor-ns-resize flex items-center justify-center z-30 shadow-lg hover:scale-110 transition-transform"
                          title="Drag to Resize Height"
                        >
                          <div className="w-3.5 h-0.5 bg-white" />
                        </div>

                        {/* Bottom handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, item, 'bottom')}
                          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-9 h-5 bg-blue-600 border-2 border-white rounded-md cursor-ns-resize flex items-center justify-center z-30 shadow-lg hover:scale-110 transition-transform"
                          title="Drag to Resize Height / Elevation"
                        >
                          <div className="w-3.5 h-0.5 bg-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Floor Slab Ground Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-600" />
            </div>

            {/* Bottom Architectural Dimension String */}
            <div className="ml-16 mt-4 flex items-center justify-between border-t pt-3 text-xs font-mono border-slate-200 text-slate-600">
              <span className="text-slate-500 font-semibold">0 mm (Corner A)</span>
              <div className="flex-1 border-t border-dashed mx-4 flex items-center justify-center border-slate-300">
                <span className="px-3 py-1 rounded-lg font-bold border shadow-xs bg-blue-50 text-blue-800 border-blue-200">
                  Total Wall Length: {roomWidth} mm ({Math.round(roomWidth / 304.8)}'-0")
                </span>
              </div>
              <span className="text-slate-500 font-semibold">{roomWidth} mm (Corner B)</span>
            </div>

            {/* Selected Unit Live Shutter & Shelf Configurator Bar */}
            {selectedFurniture && (
              <div className="mt-4 ml-16 p-3.5 rounded-2xl flex items-center justify-between z-20 text-xs shadow-md border bg-blue-50/80 border-blue-200 text-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="font-bold text-sm text-slate-900">
                    {selectedFurniture.name}
                  </span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md border bg-white text-blue-700 border-blue-200 shadow-xs">
                    {selectedFurniture.width} × {selectedFurniture.height} × {selectedFurniture.depth} mm
                  </span>
                </div>

                {/* Shutter & Shelf Steppers */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Shutters Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-xs">
                    <span className="text-[11px] font-bold text-slate-600">Shutters:</span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        shutterCount: Math.max(1, (selectedFurniture.parametric.shutterCount || 1) - 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold px-1.5 text-blue-700">
                      {selectedFurniture.parametric.shutterCount || 1}
                    </span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        shutterCount: Math.min(8, (selectedFurniture.parametric.shutterCount || 1) + 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Shelves Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-xs">
                    <span className="text-[11px] font-bold text-slate-600">Shelves:</span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        shelfCount: Math.max(0, (selectedFurniture.parametric.shelfCount !== undefined ? selectedFurniture.parametric.shelfCount : 3) - 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold px-1.5 text-purple-700">
                      {selectedFurniture.parametric.shelfCount !== undefined ? selectedFurniture.parametric.shelfCount : 3}
                    </span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        shelfCount: Math.min(8, (selectedFurniture.parametric.shelfCount !== undefined ? selectedFurniture.parametric.shelfCount : 3) + 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Drawers Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-xs">
                    <span className="text-[11px] font-bold text-slate-600">Drawers:</span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        drawerCount: Math.max(0, (selectedFurniture.parametric.drawerCount || 0) - 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold px-1.5 text-amber-700">
                      {selectedFurniture.parametric.drawerCount || 0}
                    </span>
                    <button
                      onClick={() => handleUpdateSelectedParametric({
                        drawerCount: Math.min(6, (selectedFurniture.parametric.drawerCount || 0) + 1)
                      })}
                      className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Loft Toggle */}
                  <button
                    onClick={() => handleUpdateSelectedParametric({
                      hasLoft: !selectedFurniture.parametric.hasLoft,
                      loftHeight: !selectedFurniture.parametric.hasLoft ? 800 : 0
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      selectedFurniture.parametric.hasLoft
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Loft: {selectedFurniture.parametric.hasLoft ? 'ON (800mm)' : 'OFF'}
                  </button>

                  <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                  {/* Actions */}
                  <button
                    onClick={() => handleMirror('horizontal')}
                    className="p-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-lg shadow-xs"
                    title="Mirror Horizontal"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-xs"
                    title="Duplicate Unit"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-lg shadow-xs transition-colors"
                    title="Delete Unit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
