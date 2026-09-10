'use client';

import React, { useState } from 'react';
import { ProjectInfo, Room, FurnitureItem, Door, Window, Column, Wall, TextAnnotation } from '../types/cad';
import { recalculateParametricFurniture, mirrorFurnitureItem } from '../utils/parametricEngine';
import { calculateRoomArea, calculateProjectArea } from '../utils/areaCalculations';
import { MATERIAL_PALETTE_STRUCTURED } from '../data/furnitureCatalog';
import {
  Sliders,
  Maximize,
  Palette,
  Wrench,
  Trash2,
  Copy,
  RotateCw,
  FlipHorizontal,
  Plus,
  Minus,
  Box,
  Layers,
  Check,
  ChevronRight,
  X,
  Sparkles,
  DoorOpen,
  Square,
  Type,
  LayoutGrid,
  Columns,
  Link2,
  Unlink2,
  Building2,
  Home,
  BarChart3,
  Ruler,
  CheckCircle2,
} from 'lucide-react';

interface PropertyInspectorProps {
  project: ProjectInfo;
  activeRoom: Room;
  theme?: 'light' | 'dark';
  onUpdateFurniture: (updatedItem: FurnitureItem) => void;
  onUpdateRoom: (updatedRoom: Room) => void;
  onDeleteFurniture: (id: string) => void;
  onSelectFurniture?: (id: string | null) => void;
  onSelectDoor?: (id: string | null) => void;
  onSelectWindow?: (id: string | null) => void;
  onSelectColumn?: (id: string | null) => void;
  onSelectWall?: (id: string | null) => void;
  onSelectText?: (id: string | null) => void;
  onSelectRoom?: (roomId: string) => void;
  onClearSelection?: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  project,
  activeRoom,
  onUpdateFurniture,
  onUpdateRoom,
  onDeleteFurniture,
  onSelectFurniture,
  onSelectDoor,
  onSelectWindow,
  onSelectColumn,
  onSelectWall,
  onSelectText,
  onSelectRoom,
  onClearSelection,
}) => {
  const [elementsFilter, setElementsFilter] = useState<'all' | 'furniture' | 'doors' | 'windows' | 'columns' | 'walls'>('all');
  const [lockProportions, setLockProportions] = useState<boolean>(false);

  // Selected Elements
  const selectedFurniture = activeRoom.furniture.find((f) => f.id === project.selectedFurnitureId);
  const selectedDoor = activeRoom.doors.find((d) => d.id === project.selectedDoorId);
  const selectedWindow = activeRoom.windows.find((w) => w.id === project.selectedWindowId);
  const selectedColumn = activeRoom.columns.find((c) => c.id === project.selectedColumnId);
  const selectedWall = activeRoom.walls.find((w) => w.id === project.selectedWallId);
  const selectedText = activeRoom.textAnnotations.find((t) => t.id === project.selectedTextId);

  // --- FURNITURE HANDLERS ---
  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth' | 'z', value: number) => {
    if (!selectedFurniture) return;
    const val = Math.max(10, Math.min(10000, Math.round(value)));
    if (dimension === 'z') {
      onUpdateFurniture({ ...selectedFurniture, z: val });
      return;
    }

    if (lockProportions && selectedFurniture[dimension] > 0) {
      const scaleRatio = val / selectedFurniture[dimension];
      const newWidth = dimension === 'width' ? val : Math.max(50, Math.round(selectedFurniture.width * scaleRatio));
      const newHeight = dimension === 'height' ? val : Math.max(50, Math.round(selectedFurniture.height * scaleRatio));
      const newDepth = dimension === 'depth' ? val : Math.max(50, Math.round(selectedFurniture.depth * scaleRatio));

      const updated = recalculateParametricFurniture(
        selectedFurniture,
        newWidth,
        newHeight,
        newDepth
      );
      onUpdateFurniture(updated);
    } else {
      const updated = recalculateParametricFurniture(
        selectedFurniture,
        dimension === 'width' ? val : selectedFurniture.width,
        dimension === 'height' ? val : selectedFurniture.height,
        dimension === 'depth' ? val : selectedFurniture.depth
      );
      onUpdateFurniture(updated);
    }
  };

  const handleStepDimension = (dimension: 'width' | 'height' | 'depth' | 'z', step: number) => {
    if (!selectedFurniture) return;
    const current = selectedFurniture[dimension] || 0;
    handleDimensionChange(dimension, current + step);
  };

  const handleParametricChange = (key: string, value: any) => {
    if (!selectedFurniture) return;
    const updated: FurnitureItem = {
      ...selectedFurniture,
      parametric: {
        ...selectedFurniture.parametric,
        [key]: value,
      },
    };
    onUpdateFurniture(recalculateParametricFurniture(updated));
  };

  const handleStepParametric = (key: 'shutterCount' | 'shelfCount' | 'drawerCount', delta: number, min = 0, max = 10) => {
    if (!selectedFurniture) return;
    const current = (selectedFurniture.parametric[key] as number) || 0;
    const next = Math.max(min, Math.min(max, current + delta));
    handleParametricChange(key, next);
  };

  const handleMaterialChange = (key: string, value: string) => {
    if (!selectedFurniture) return;
    const updated: FurnitureItem = {
      ...selectedFurniture,
      materials: {
        ...selectedFurniture.materials,
        [key]: value,
      },
    };
    onUpdateFurniture(updated);
  };

  const handleMirror = (direction: 'horizontal' | 'vertical') => {
    if (!selectedFurniture) return;
    const mirrored = mirrorFurnitureItem(selectedFurniture, direction);
    onUpdateFurniture(mirrored);
  };

  const handleRotate90 = () => {
    if (!selectedFurniture) return;
    const nextRotation = ((selectedFurniture.rotation || 0) + 90) % 360;
    onUpdateFurniture({
      ...selectedFurniture,
      rotation: nextRotation,
    });
  };

  const handleDuplicateFurniture = () => {
    if (!selectedFurniture) return;
    const newItem: FurnitureItem = {
      ...selectedFurniture,
      id: `f_${Date.now()}`,
      name: `${selectedFurniture.name} (Copy)`,
      x: Math.min(activeRoom.widthMm - selectedFurniture.width - 50, selectedFurniture.x + selectedFurniture.width + 50),
      y: selectedFurniture.y,
    };
    onUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    if (onSelectFurniture) {
      onSelectFurniture(newItem.id);
    }
  };

  // --- DOOR HANDLERS ---
  const handleUpdateDoor = (updated: Door) => {
    onUpdateRoom({
      ...activeRoom,
      doors: activeRoom.doors.map((d) => (d.id === updated.id ? updated : d)),
    });
  };

  const handleDeleteDoor = (id: string) => {
    onUpdateRoom({
      ...activeRoom,
      doors: activeRoom.doors.filter((d) => d.id !== id),
    });
    if (onSelectDoor) onSelectDoor(null);
  };

  // --- WINDOW HANDLERS ---
  const handleUpdateWindow = (updated: Window) => {
    onUpdateRoom({
      ...activeRoom,
      windows: activeRoom.windows.map((w) => (w.id === updated.id ? updated : w)),
    });
  };

  const handleDeleteWindow = (id: string) => {
    onUpdateRoom({
      ...activeRoom,
      windows: activeRoom.windows.filter((w) => w.id !== id),
    });
    if (onSelectWindow) onSelectWindow(null);
  };

  // --- COLUMN HANDLERS ---
  const handleUpdateColumn = (updated: Column) => {
    onUpdateRoom({
      ...activeRoom,
      columns: activeRoom.columns.map((c) => (c.id === updated.id ? updated : c)),
    });
  };

  const handleDeleteColumn = (id: string) => {
    onUpdateRoom({
      ...activeRoom,
      columns: activeRoom.columns.filter((c) => c.id !== id),
    });
    if (onSelectColumn) onSelectColumn(null);
  };

  // --- WALL HANDLERS ---
  const handleUpdateWall = (updated: Wall) => {
    onUpdateRoom({
      ...activeRoom,
      walls: activeRoom.walls.map((w) => (w.id === updated.id ? updated : w)),
    });
  };

  const handleDeleteWall = (id: string) => {
    if (activeRoom.walls.length <= 3) return;
    onUpdateRoom({
      ...activeRoom,
      walls: activeRoom.walls.filter((w) => w.id !== id),
    });
    if (onSelectWall) onSelectWall(null);
  };

  // --- TEXT HANDLERS ---
  const handleUpdateText = (updated: TextAnnotation) => {
    onUpdateRoom({
      ...activeRoom,
      textAnnotations: activeRoom.textAnnotations.map((t) => (t.id === updated.id ? updated : t)),
    });
  };

  const handleDeleteText = (id: string) => {
    onUpdateRoom({
      ...activeRoom,
      textAnnotations: activeRoom.textAnnotations.filter((t) => t.id !== id),
    });
    if (onSelectText) onSelectText(null);
  };

  // --- QUICK ADD MODULAR ITEMS ---
  const handleQuickAddUnit = (type: 'base' | 'wall' | 'wardrobe' | 'loft' | 'tv' | 'bed' | 'door' | 'window' | 'column') => {
    const lastItem = activeRoom.furniture[activeRoom.furniture.length - 1];
    const posX = lastItem ? Math.min(activeRoom.widthMm - 900, lastItem.x + lastItem.width + 50) : 300;
    const posY = 150;

    if (type === 'door') {
      const newDoor: Door = {
        id: `door_${Date.now()}`,
        x: 600,
        y: activeRoom.depthMm,
        width: 900,
        height: 2100,
        wallSide: 'bottom',
        rotation: 0,
        swing: 'inward_left',
      };
      onUpdateRoom({ ...activeRoom, doors: [...activeRoom.doors, newDoor] });
      if (onSelectDoor) onSelectDoor(newDoor.id);
      return;
    }

    if (type === 'window') {
      const newWin: Window = {
        id: `win_${Date.now()}`,
        x: 1200,
        y: 0,
        width: 1200,
        height: 1200,
        sillHeight: 900,
        wallSide: 'top',
        rotation: 0,
        type: 'sliding',
      };
      onUpdateRoom({ ...activeRoom, windows: [...activeRoom.windows, newWin] });
      if (onSelectWindow) onSelectWindow(newWin.id);
      return;
    }

    if (type === 'column') {
      const newCol: Column = {
        id: `col_${Date.now()}`,
        x: 200,
        y: 200,
        width: 300,
        depth: 300,
        height: 2900,
      };
      onUpdateRoom({ ...activeRoom, columns: [...activeRoom.columns, newCol] });
      if (onSelectColumn) onSelectColumn(newCol.id);
      return;
    }

    let newItem: FurnitureItem;
    if (type === 'base') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'kitchen_base_2shutter',
        category: 'kitchen',
        name: 'Modular Base Cabinet (2-Door)',
        x: posX,
        y: posY,
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
        catalogId: 'kitchen_wall_2shutter',
        category: 'kitchen',
        name: 'Overhead Wall Cabinet (2-Door)',
        x: posX,
        y: posY,
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
          handleType: 'edge_lip',
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
        name: 'Floor-to-Ceiling Wardrobe (3-Door)',
        x: posX,
        y: posY,
        z: 0,
        width: 1200,
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
    } else if (type === 'loft') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'kitchen_loft_unit',
        category: 'kitchen',
        name: 'Top Loft Module Unit',
        x: posX,
        y: posY,
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
    } else if (type === 'tv') {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'tv_console_wall',
        category: 'tv_unit',
        name: 'Floating TV Console Unit',
        x: posX,
        y: posY,
        z: 350,
        width: 1800,
        height: 350,
        depth: 400,
        rotation: 0,
        parametric: {
          carcassThickness: 18,
          backPlyThickness: 9,
          shutterCount: 2,
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
          handlesCount: 2,
          legsCount: 0,
        },
        materials: {
          carcassMaterial: '18mm HDHMR Board',
          carcassFinish: 'Matte Charcoal',
          shutterMaterial: 'Natural Woodgrain Laminate',
          shutterFinish: 'American Walnut',
          shutterColor: '#78350F',
          counterMaterial: '',
        },
      };
    } else {
      newItem = {
        id: `f_${Date.now()}`,
        catalogId: 'bed_king_storage',
        category: 'bed',
        name: 'King Bed with Hydraulic Lift',
        x: posX,
        y: posY,
        z: 0,
        width: 1800,
        height: 450,
        depth: 2000,
        rotation: 0,
        parametric: {
          carcassThickness: 18,
          backPlyThickness: 12,
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
          handlesCount: 2,
          legsCount: 6,
        },
        materials: {
          carcassMaterial: '18mm BWP Plywood',
          carcassFinish: 'Natural Oak',
          shutterMaterial: 'Premium Fabric',
          shutterFinish: 'Slate Velvet',
          shutterColor: '#334155',
          counterMaterial: '',
        },
      };
    }

    onUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    if (onSelectFurniture) {
      onSelectFurniture(newItem.id);
    }
  };

  // ==========================================
  // CASE 1: DOOR SELECTED
  // ==========================================
  if (selectedDoor) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <DoorOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Door Opening</span>
              <span className="text-[10px] text-amber-700 font-mono">
                {selectedDoor.width} × {selectedDoor.height} mm
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteDoor(selectedDoor.id)}
              className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Delete Door"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          {/* Width Selector */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Door Width</span>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              {[750, 900, 1050, 1200].map((w) => (
                <button
                  key={w}
                  onClick={() => handleUpdateDoor({ ...selectedDoor, width: w })}
                  className={`py-1.5 rounded border text-center font-bold transition-all ${
                    selectedDoor.width === w
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {w} mm
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-600">Custom Width:</span>
              <input
                type="number"
                step="50"
                value={selectedDoor.width}
                onChange={(e) => handleUpdateDoor({ ...selectedDoor, width: parseInt(e.target.value) || 750 })}
                className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>

          {/* Swing Direction */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Swing Direction</span>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'inward_left', label: 'Inward Left' },
                { id: 'inward_right', label: 'Inward Right' },
                { id: 'outward_left', label: 'Outward Left' },
                { id: 'outward_right', label: 'Outward Right' },
                { id: 'sliding', label: 'Pocket Sliding' },
              ].map((sw) => (
                <button
                  key={sw.id}
                  onClick={() => handleUpdateDoor({ ...selectedDoor, swing: sw.id as any })}
                  className={`w-full py-1.5 px-2.5 rounded border text-left flex items-center justify-between transition-all ${
                    selectedDoor.swing === sw.id
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{sw.label}</span>
                  {selectedDoor.swing === sw.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Position Coordinates */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Position Coordinates</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">X (mm)</label>
                <input
                  type="number"
                  step="50"
                  value={selectedDoor.x}
                  onChange={(e) => handleUpdateDoor({ ...selectedDoor, x: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Y (mm)</label>
                <input
                  type="number"
                  step="50"
                  value={selectedDoor.y}
                  onChange={(e) => handleUpdateDoor({ ...selectedDoor, y: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: WINDOW SELECTED
  // ==========================================
  if (selectedWindow) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <Columns className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Window Opening</span>
              <span className="text-[10px] text-sky-700 font-mono">
                {selectedWindow.width} × {selectedWindow.height} mm (Sill +{selectedWindow.sillHeight || 900})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteWindow(selectedWindow.id)}
              className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Delete Window"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          {/* Width Presets */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Window Width</span>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              {[900, 1200, 1500, 1800, 2400].map((w) => (
                <button
                  key={w}
                  onClick={() => handleUpdateWindow({ ...selectedWindow, width: w })}
                  className={`py-1.5 rounded border text-center font-bold transition-all ${
                    selectedWindow.width === w
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {w} mm
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-600">Custom Width:</span>
              <input
                type="number"
                step="50"
                value={selectedWindow.width}
                onChange={(e) => handleUpdateWindow({ ...selectedWindow, width: parseInt(e.target.value) || 900 })}
                className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>

          {/* Type & Sill Height */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
                Window Type
              </label>
              <select
                value={selectedWindow.type || 'sliding'}
                onChange={(e) => handleUpdateWindow({ ...selectedWindow, type: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="sliding">2/3 Track Sliding with Mesh</option>
                <option value="casement">Casement Openable Window</option>
                <option value="fixed">Fixed Picture Window / Glazing</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Sill Height (mm)</label>
                <input
                  type="number"
                  step="50"
                  value={selectedWindow.sillHeight || 900}
                  onChange={(e) => handleUpdateWindow({ ...selectedWindow, sillHeight: parseInt(e.target.value) || 900 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Height (mm)</label>
                <input
                  type="number"
                  step="50"
                  value={selectedWindow.height}
                  onChange={(e) => handleUpdateWindow({ ...selectedWindow, height: parseInt(e.target.value) || 1200 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 3: COLUMN SELECTED
  // ==========================================
  if (selectedColumn) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <Square className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">RCC Structural Column</span>
              <span className="text-[10px] text-emerald-700 font-mono">
                {selectedColumn.width} × {selectedColumn.depth} mm
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteColumn(selectedColumn.id)}
              className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Delete Column"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Column Dimensions</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Width (mm)</label>
                <input
                  type="number"
                  step="25"
                  value={selectedColumn.width}
                  onChange={(e) => handleUpdateColumn({ ...selectedColumn, width: parseInt(e.target.value) || 200 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Depth (mm)</label>
                <input
                  type="number"
                  step="25"
                  value={selectedColumn.depth}
                  onChange={(e) => handleUpdateColumn({ ...selectedColumn, depth: parseInt(e.target.value) || 200 })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 4: WALL SELECTED
  // ==========================================
  if (selectedWall) {
    const wallLength = Math.round(Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.y2 - selectedWall.y1));
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <LayoutGrid className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Wall Segment</span>
              <span className="text-[10px] text-purple-700 font-mono">
                {wallLength} mm Length ({selectedWall.thickness}mm thk)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteWall(selectedWall.id)}
              className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Delete Wall"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Wall Thickness</span>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              {[100, 150, 230].map((th) => (
                <button
                  key={th}
                  onClick={() => handleUpdateWall({ ...selectedWall, thickness: th })}
                  className={`py-1.5 rounded border text-center font-bold transition-all ${
                    selectedWall.thickness === th
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {th} mm
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 5: TEXT ANNOTATION SELECTED
  // ==========================================
  if (selectedText) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <Type className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Text Annotation</span>
              <span className="text-[10px] text-blue-700 font-mono truncate max-w-[140px] block">
                "{selectedText.text}"
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteText(selectedText.id)}
              className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Delete Text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Annotation Text</label>
            <input
              type="text"
              value={selectedText.text}
              onChange={(e) => handleUpdateText({ ...selectedText, text: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 6: NO ELEMENT SELECTED (ROOM / LAYOUT INSPECTOR)
  // ==========================================
  if (!selectedFurniture) {
    const totalElements =
      activeRoom.furniture.length +
      activeRoom.doors.length +
      activeRoom.windows.length +
      activeRoom.columns.length +
      activeRoom.walls.length;

    const areaSqM = ((activeRoom.widthMm * activeRoom.depthMm) / 1000000).toFixed(2);
    const areaSqFt = (((activeRoom.widthMm * activeRoom.depthMm) / 1000000) * 10.7639).toFixed(1);
    const perimeterM = (((activeRoom.widthMm + activeRoom.depthMm) * 2) / 1000).toFixed(2);

    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col select-none flex-shrink-0 text-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Room & Unit Inspector</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            {activeRoom.furniture.length} Cabinets
          </span>
        </div>

        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          {/* Quick Selection Hint Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Any Object to View Properties</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Click any cabinet, door, window, or column on the 2D CAD canvas or 3D view, or choose below to configure its{' '}
              <strong className="text-slate-900">dimensions, shutters, shelves, drawers & materials</strong>.
            </p>
          </div>

          {/* Interactive Room Elements Navigator / List */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              <span>Room Elements</span>
              <span className="text-slate-400 font-mono text-[10px]">{totalElements} total</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 mb-2 text-[10px]">
              <button
                onClick={() => setElementsFilter('all')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  elementsFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalElements})
              </button>
              <button
                onClick={() => setElementsFilter('furniture')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  elementsFilter === 'furniture' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Units ({activeRoom.furniture.length})
              </button>
              <button
                onClick={() => setElementsFilter('doors')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  elementsFilter === 'doors' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Openings ({activeRoom.doors.length + activeRoom.windows.length})
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {/* Furniture Items */}
              {(elementsFilter === 'all' || elementsFilter === 'furniture') &&
                activeRoom.furniture.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectFurniture && onSelectFurniture(item.id)}
                    className="group p-2 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 rounded cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 group-hover:scale-125 transition-transform" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-blue-700">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {item.width}×{item.height}×{item.depth}mm • {item.parametric.shutterCount || 0} Shutters •{' '}
                          {item.parametric.shelfCount || 0} Shelves
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}

              {/* Doors */}
              {(elementsFilter === 'all' || elementsFilter === 'doors') &&
                activeRoom.doors.map((door) => (
                  <div
                    key={door.id}
                    onClick={() => onSelectDoor && onSelectDoor(door.id)}
                    className="group p-2 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <DoorOpen className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-amber-700">
                          Door ({door.width}×{door.height}mm)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">
                          Swing: {door.swing.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}

              {/* Windows */}
              {(elementsFilter === 'all' || elementsFilter === 'doors') &&
                activeRoom.windows.map((win) => (
                  <div
                    key={win.id}
                    onClick={() => onSelectWindow && onSelectWindow(win.id)}
                    className="group p-2 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-400 rounded cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Columns className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-sky-700">
                          Window ({win.width}×{win.height}mm)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">
                          Sill: +{win.sillHeight || 900}mm • {win.type || 'Sliding'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}

              {/* Columns */}
              {(elementsFilter === 'all' || elementsFilter === 'columns') &&
                activeRoom.columns.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => onSelectColumn && onSelectColumn(col.id)}
                    className="group p-2 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Square className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-emerald-700">
                          RCC Column ({col.width}×{col.depth}mm)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Height {col.height}mm
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}

              {activeRoom.furniture.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-50 rounded border border-slate-200">
                  No cabinets placed yet. Click below to add your first modular unit.
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Modular Units */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              + Quick Add Modular Elements
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => handleQuickAddUnit('base')}
                className="p-2 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-emerald-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + Base Unit
                </span>
                <span className="text-[9px] text-slate-500 font-mono">860mm H with Slab</span>
              </button>
              <button
                onClick={() => handleQuickAddUnit('wall')}
                className="p-2 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-sky-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + Wall Unit
                </span>
                <span className="text-[9px] text-slate-500 font-mono">700mm H Overhead</span>
              </button>
              <button
                onClick={() => handleQuickAddUnit('wardrobe')}
                className="p-2 bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-purple-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + Wardrobe
                </span>
                <span className="text-[9px] text-slate-500 font-mono">2100mm Full Height</span>
              </button>
              <button
                onClick={() => handleQuickAddUnit('loft')}
                className="p-2 bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-amber-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + Top Loft
                </span>
                <span className="text-[9px] text-slate-500 font-mono">800mm to Ceiling</span>
              </button>
              <button
                onClick={() => handleQuickAddUnit('tv')}
                className="p-2 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-orange-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + TV Unit
                </span>
                <span className="text-[9px] text-slate-500 font-mono">1800mm Console</span>
              </button>
              <button
                onClick={() => handleQuickAddUnit('bed')}
                className="p-2 bg-white hover:bg-yellow-50/60 border border-slate-200 hover:border-yellow-400 rounded text-left transition-all group shadow-sm"
              >
                <span className="font-semibold text-yellow-700 block text-[11px] group-hover:translate-x-0.5 transition-transform">
                  + King Bed
                </span>
                <span className="text-[9px] text-slate-500 font-mono">1800×2000mm</span>
              </button>
            </div>
          </div>

          {/* Room CAD Specifications & Area Analysis */}
          <div className="border-t border-slate-200 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Ruler className="w-3 h-3 text-blue-600" />
                <span>Room Dimensions & Specs</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {calculateRoomArea(activeRoom).formattedSqFt} sq.ft
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={activeRoom.name}
                  onChange={(e) => onUpdateRoom({ ...activeRoom, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={activeRoom.widthMm}
                    onChange={(e) => onUpdateRoom({ ...activeRoom, widthMm: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
                    Depth (mm)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={activeRoom.depthMm}
                    onChange={(e) => onUpdateRoom({ ...activeRoom, depthMm: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Active Room Carpet Area Highlighting Card */}
              {(() => {
                const roomMetrics = calculateRoomArea(activeRoom);
                return (
                  <div className="p-3 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-lg border border-blue-200 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                      <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                        {activeRoom.name} Area
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-700">{roomMetrics.formattedSqFt}</span>
                        <span className="text-[10px] text-blue-800 ml-0.5">sq.ft</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                      <div className="text-slate-600">
                        <span className="text-slate-400 block text-[9px] uppercase">Metric Area:</span>
                        <strong className="text-slate-800">{roomMetrics.formattedSqM} m²</strong>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400 block text-[9px] uppercase">In Feet:</span>
                        <strong className="text-slate-800">{roomMetrics.formattedDimensionsFt}</strong>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400 block text-[9px] uppercase">Wall Perimeter:</span>
                        <strong className="text-slate-800">{roomMetrics.perimeterM} m</strong>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400 block text-[9px] uppercase">Perimeter Ft:</span>
                        <strong className="text-slate-800">{roomMetrics.perimeterFt} ft</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Whole Project Total Area & All Rooms Breakdown Card */}
          {(() => {
            const projectMetrics = calculateProjectArea(project);
            return (
              <div className="border-t border-slate-200 pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Whole Project Area</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {projectMetrics.totalRooms} {projectMetrics.totalRooms === 1 ? 'Room' : 'Rooms'}
                  </span>
                </div>

                {/* Total Project Area Highlight */}
                <div className="p-3 bg-slate-900 text-white rounded-lg shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    <span>Project Total Carpet Area</span>
                    <span>All Rooms</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {projectMetrics.formattedTotalSqFt}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">sq.ft</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-medium">
                      ({projectMetrics.formattedTotalSqM} m²)
                    </span>
                  </div>
                </div>

                {/* All Rooms List with Individual Sq.Ft & Share */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    All Rooms Square Feet
                  </span>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                    {projectMetrics.rooms.map((rm) => {
                      const isCurrent = rm.roomId === activeRoom.id;
                      return (
                        <div
                          key={rm.roomId}
                          onClick={() => onSelectRoom && onSelectRoom(rm.roomId)}
                          className={`p-2 rounded-md border text-xs transition-all ${
                            onSelectRoom ? 'cursor-pointer' : ''
                          } ${
                            isCurrent
                              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400/20'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold truncate max-w-[130px] ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                              {rm.roomName}
                            </span>
                            <div className="flex items-baseline gap-1 font-mono">
                              <strong className={`font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-900'}`}>
                                {rm.formattedSqFt}
                              </strong>
                              <span className="text-[10px] text-slate-500">sq.ft</span>
                            </div>
                          </div>

                          {/* Dimensions & Percentage Bar */}
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{rm.widthMm}×{rm.depthMm} mm</span>
                            <span className="font-semibold text-slate-600">{rm.percentageOfProject}% of total</span>
                          </div>

                          {/* Mini visual progress bar */}
                          <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isCurrent ? 'bg-blue-600' : 'bg-slate-400'}`}
                              style={{ width: `${Math.max(4, Math.min(100, rm.percentageOfProject))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 7: SELECTED FURNITURE CABINET
  // ==========================================
  const shutterCount = selectedFurniture.parametric.shutterCount || 1;
  const shelfCount = selectedFurniture.parametric.shelfCount || 0;
  const drawerCount = selectedFurniture.parametric.drawerCount || 0;
  const hasLoft = selectedFurniture.parametric.hasLoft || false;
  const loftHeight = selectedFurniture.parametric.loftHeight || 600;

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden select-none flex-shrink-0 text-slate-800">
      {/* Header with Title and Quick Action Bar */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="overflow-hidden pr-2">
          <input
            type="text"
            value={selectedFurniture.name}
            onChange={(e) => onUpdateFurniture({ ...selectedFurniture, name: e.target.value })}
            className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-500 focus:outline-none truncate w-full"
            title="Click to rename"
          />
          <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
            <Box className="w-2.5 h-2.5" />
            {selectedFurniture.category.toUpperCase()} MODULE • {selectedFurniture.width}×{selectedFurniture.height}×
            {selectedFurniture.depth}
          </span>
          {selectedFurniture.description && (
            <span
              className="text-[9.5px] text-slate-400 block truncate"
              title={selectedFurniture.description}
            >
              {selectedFurniture.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDuplicateFurniture}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Duplicate Unit"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRotate90}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleMirror('horizontal')}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Mirror Horizontal"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Deselect (Back to Room List)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDeleteFurniture(selectedFurniture.id)}
            className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Delete Unit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
        {/* Dynamic Architectural Front-Cut Live Preview Diagram */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Live Cabinet Cross-Section
            </span>
            <span className="text-[9px] font-mono text-blue-600 font-semibold">
              {selectedFurniture.width}W × {selectedFurniture.height}H mm
            </span>
          </div>

          {/* SVG Diagram showing shutters and internal shelf lines */}
          <div className="w-full h-24 bg-white border border-slate-200 rounded flex items-center justify-center p-2 relative overflow-hidden shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
              {/* Carcass Outer Box */}
              <rect x="10" y="5" width="180" height="90" fill="#f8fafc" stroke="#2563eb" strokeWidth="2" />

              {/* Countertop if enabled */}
              {selectedFurniture.parametric.hasCountertop && (
                <rect x="6" y="2" width="188" height="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="1" />
              )}

              {/* Shelves horizontal divisions */}
              {shelfCount > 0 &&
                Array.from({ length: shelfCount }).map((_, idx) => {
                  const yPos = 5 + ((idx + 1) * 90) / (shelfCount + 1);
                  return (
                    <line
                      key={idx}
                      x1="12"
                      y1={yPos}
                      x2="188"
                      y2={yPos}
                      stroke="#0284c7"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                  );
                })}

              {/* Shutters vertical divisions */}
              {shutterCount > 1 &&
                Array.from({ length: shutterCount - 1 }).map((_, idx) => {
                  const xPos = 10 + ((idx + 1) * 180) / shutterCount;
                  return (
                    <line key={idx} x1={xPos} y1="5" x2={xPos} y2="95" stroke="#64748b" strokeWidth="1.5" />
                  );
                })}

              {/* Drawers indications if any */}
              {drawerCount > 0 &&
                Array.from({ length: drawerCount }).map((_, idx) => {
                  const yPos = 5 + (idx * 90) / drawerCount;
                  return (
                    <g key={idx}>
                      <line x1="12" y1={yPos} x2="188" y2={yPos} stroke="#d97706" strokeWidth="1" />
                      <circle cx="100" cy={yPos + 90 / (drawerCount * 2)} r="2" fill="#d97706" />
                    </g>
                  );
                })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5">
            <span>
              {shutterCount} Shutter{shutterCount > 1 ? 's' : ''}
            </span>
            <span>
              {shelfCount} Shelf{shelfCount > 1 ? 'ves' : ''}
            </span>
            <span>
              {drawerCount} Drawer{drawerCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 1. Dedicated Shutters & Doors Section */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <Box className="w-3.5 h-3.5" />
              <span>Shutters & Doors</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {shutterCount === 0 || selectedFurniture.parametric.shutterType === 'open'
                ? 'Open / 0 Doors'
                : `${shutterCount} Door${shutterCount > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Stepper with Large Clickable Buttons */}
          <div className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[11px] text-slate-800 font-semibold block">Number of Shutters</span>
              {shutterCount > 0 && selectedFurniture.parametric.shutterType !== 'open' && (
                <span className="text-[10px] text-slate-500 font-mono">
                  ~{Math.round(selectedFurniture.width / shutterCount)} mm / shutter
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepParametric('shutterCount', -1, 0, 8)}
                disabled={shutterCount <= 0}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:pointer-events-none text-slate-700 rounded-md font-bold text-sm transition-colors cursor-pointer"
                title="Decrease Shutters"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                max="8"
                value={shutterCount}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(8, parseInt(e.target.value) || 0));
                  handleParametricChange('shutterCount', val);
                }}
                className="w-10 h-8 text-center bg-slate-50 border border-slate-200 rounded-md font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleStepParametric('shutterCount', 1, 0, 8)}
                disabled={shutterCount >= 8}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none text-white rounded-md font-bold text-sm transition-colors shadow-xs cursor-pointer"
                title="Increase Shutters"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for Shutters */}
          <div className="grid grid-cols-5 gap-1 text-[10px] font-medium font-mono">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  handleParametricChange('shutterCount', num);
                  if (num === 0) {
                    handleParametricChange('shutterType', 'open');
                  } else if (selectedFurniture.parametric.shutterType === 'open') {
                    handleParametricChange('shutterType', 'hinged');
                  }
                }}
                className={`py-1.5 rounded border text-center transition-all cursor-pointer ${
                  shutterCount === num
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {num === 0 ? 'Open' : `${num} ${num === 1 ? 'Door' : 'Doors'}`}
              </button>
            ))}
          </div>

          {/* Shutter Profile Type Selector */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
              Shutter Style / Profile
            </label>
            <select
              value={selectedFurniture.parametric.shutterType || 'hinged'}
              onChange={(e) => {
                const newType = e.target.value;
                handleParametricChange('shutterType', newType);
                if (newType === 'open') {
                  handleParametricChange('shutterCount', 0);
                } else if (shutterCount === 0) {
                  handleParametricChange('shutterCount', newType === 'sliding' ? 2 : 1);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="hinged">Hinged Door (Soft-Close European)</option>
              <option value="sliding">Sliding Shutter (Track System)</option>
              <option value="fluted">Fluted / Ribbed Decorative Panel</option>
              <option value="glass">Aluminum Profile Tinted Glass</option>
              <option value="open">Open / No Shutter (Display Unit)</option>
            </select>
          </div>

          {/* Handle Style */}
          {selectedFurniture.parametric.shutterType !== 'open' && (
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-medium tracking-wider block mb-1">
                Handle Type
              </label>
              <select
                value={selectedFurniture.parametric.handleType || 'g_profile'}
                onChange={(e) => handleParametricChange('handleType', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="g_profile">G-Profile Concealed (J-Pull)</option>
                <option value="edge_lip">Edge Lip Profile (Black/Gold)</option>
                <option value="push_to_open">Push-to-Open (Touch Latch)</option>
                <option value="bar">Designer Bar Handle (128/192mm)</option>
                <option value="concealed">Concealed / Inset Handle</option>
              </select>
            </div>
          )}
        </div>

        {/* 2. Dedicated Internal Shelves Section */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Internal Shelves</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {shelfCount} Shelf{shelfCount > 1 ? 'ves' : ''}
            </span>
          </div>

          {/* Stepper with Large Clickable Buttons */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <span className="text-[11px] text-slate-700 font-medium pl-1">Number of Shelves:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStepParametric('shelfCount', -1, 0, 8)}
                disabled={shelfCount <= 0}
                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700 rounded font-bold text-sm transition-colors"
                title="Decrease Shelves"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="8"
                value={shelfCount}
                onChange={(e) => handleParametricChange('shelfCount', parseInt(e.target.value) || 0)}
                className="w-8 text-center bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none"
              />
              <button
                onClick={() => handleStepParametric('shelfCount', 1, 0, 8)}
                disabled={shelfCount >= 8}
                className="w-7 h-7 flex items-center justify-center bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded font-bold text-sm transition-colors shadow-sm"
                title="Increase Shelves"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for Shelves */}
          <div className="grid grid-cols-5 gap-1 text-[10px] font-medium font-mono">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handleParametricChange('shelfCount', num)}
                className={`py-1 rounded border text-center transition-all ${
                  shelfCount === num
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {num} {num === 1 ? 'Shelf' : 'Shelves'}
              </button>
            ))}
          </div>

          {/* Real-time compartment spacing info */}
          <div className="p-2 bg-white rounded text-[10px] font-mono text-slate-600 flex items-center justify-between border border-slate-200">
            <span>Clear Height Per Opening:</span>
            <strong className="text-sky-700 font-bold">
              ~{Math.round((selectedFurniture.height - (shelfCount + 1) * 18) / (shelfCount + 1))} mm
            </strong>
          </div>
        </div>

        {/* 3. Dedicated Drawers & Pull-Outs Section */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Drawers & Pull-Outs</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {drawerCount} Drawer{drawerCount > 1 ? 's' : ''}
            </span>
          </div>

          {/* Stepper with Large Clickable Buttons */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <span className="text-[11px] text-slate-700 font-medium pl-1">Number of Drawers:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStepParametric('drawerCount', -1, 0, 6)}
                disabled={drawerCount <= 0}
                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700 rounded font-bold text-sm transition-colors"
                title="Decrease Drawers"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="6"
                value={drawerCount}
                onChange={(e) => handleParametricChange('drawerCount', parseInt(e.target.value) || 0)}
                className="w-8 text-center bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none"
              />
              <button
                onClick={() => handleStepParametric('drawerCount', 1, 0, 6)}
                disabled={drawerCount >= 6}
                className="w-7 h-7 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded font-bold text-sm transition-colors shadow-sm"
                title="Increase Drawers"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for Drawers */}
          <div className="grid grid-cols-5 gap-1 text-[10px] font-medium font-mono">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handleParametricChange('drawerCount', num)}
                className={`py-1 rounded border text-center transition-all ${
                  drawerCount === num
                    ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {num} {num === 1 ? 'Drawer' : 'Drawers'}
              </button>
            ))}
          </div>
        </div>

        {/* 3b. Construction Type -- Full Modular (factory carcass box) vs Semi Modular (frame + shutter only, box is civil-built) */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Construction Type
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleParametricChange('constructionType', 'full_modular')}
              className={`px-2 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
                (selectedFurniture.parametric.constructionType || 'full_modular') === 'full_modular'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
              }`}
            >
              Full Modular
            </button>
            <button
              type="button"
              onClick={() => handleParametricChange('constructionType', 'semi_modular')}
              className={`px-2 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
                selectedFurniture.parametric.constructionType === 'semi_modular'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-amber-400'
              }`}
            >
              Semi Modular
            </button>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-snug">
            {selectedFurniture.parametric.constructionType === 'semi_modular'
              ? 'Cutting list skips the plywood carcass (box is civil/masonry-built) and lists only a wooden frame batten + shutters.'
              : 'Cutting list includes the full factory-made carcass box (sides, top, bottom, back, shelves) plus shutters.'}
          </p>
        </div>

        {/* 4. Top Loft Module & Countertop Toggles */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Add-on Modules & Countertop
          </span>

          {/* Top Loft Toggle */}
          <div className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
            <label className="text-[11px] text-slate-700 font-medium cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasLoft}
                onChange={(e) => {
                  handleParametricChange('hasLoft', e.target.checked);
                  if (e.target.checked && (!selectedFurniture.parametric.loftHeight || selectedFurniture.parametric.loftHeight === 0)) {
                    handleParametricChange('loftHeight', 800);
                  }
                }}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
              <span>Top Loft Module</span>
            </label>
            {hasLoft && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="50"
                  value={loftHeight}
                  onChange={(e) => handleParametricChange('loftHeight', parseInt(e.target.value) || 600)}
                  className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-purple-700 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[9px] text-slate-400 font-mono">mm</span>
              </div>
            )}
          </div>

          {/* Kitchen Base Countertop Slab Toggle */}
          <div className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
            <label className="text-[11px] text-slate-700 font-medium cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFurniture.parametric.hasCountertop || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  handleParametricChange('hasCountertop', checked);
                  if (checked) {
                    handleParametricChange('countertopThickness', 20);
                    handleParametricChange('countertopOverhang', 25);
                    handleParametricChange('countertopMaterial', 'Quartz Calacatta Gold');
                    handleMaterialChange('counterMaterial', 'Quartz Calacatta Gold');
                  } else {
                    handleParametricChange('countertopThickness', 0);
                    handleParametricChange('countertopOverhang', 0);
                    handleParametricChange('countertopMaterial', '');
                    handleMaterialChange('counterMaterial', '');
                  }
                }}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
              <span>Kitchen Base Countertop Slab (20mm Quartz)</span>
            </label>
            {selectedFurniture.parametric.hasCountertop && (
              <span className="text-[10px] text-emerald-600 font-mono font-semibold">25mm Drip</span>
            )}
          </div>
        </div>

        {/* 5. Dimensions (W, H, D, Z) with Steppers & Proportional Constraint Toggler */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-widest">
              <Maximize className="w-3.5 h-3.5 text-blue-600" />
              <span>Dimensions & Elevation</span>
            </div>
            {/* Proportional Constraint Toggler */}
            <button
              type="button"
              onClick={() => setLockProportions(!lockProportions)}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                lockProportions
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={lockProportions ? 'Aspect Ratio Locked: Resizing any dimension scales W, H, D proportionally' : 'Aspect Ratio Unlocked: Edit dimensions independently'}
            >
              {lockProportions ? (
                <>
                  <Link2 className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>Ratio Locked</span>
                </>
              ) : (
                <>
                  <Unlink2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lock Ratio</span>
                </>
              )}
            </button>
          </div>

          {lockProportions && (
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded px-2 py-1 text-[10px] text-blue-800 font-mono">
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3 text-blue-600 inline" />
                <span>Proportional Scaling Active</span>
              </span>
              <span className="font-bold text-blue-900">
                W:{selectedFurniture.width} × H:{selectedFurniture.height} × D:{selectedFurniture.depth}
              </span>
            </div>
          )}

          <div className="relative">
            {lockProportions && (
              <div className="absolute -left-1.5 top-3 bottom-12 w-1 border-l-2 border-y-2 border-blue-500 rounded-l pointer-events-none" />
            )}
            <div className="grid grid-cols-2 gap-2">
              {/* Width */}
              <div className={`p-2 bg-white rounded border transition-colors ${lockProportions ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                    WIDTH (W)
                    {lockProportions && <Link2 className="w-2.5 h-2.5 text-blue-500" />}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepDimension('width', -50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStepDimension('width', 50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="25"
                    value={selectedFurniture.width}
                    onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 100)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              {/* Depth */}
              <div className={`p-2 bg-white rounded border transition-colors ${lockProportions ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                    DEPTH (D)
                    {lockProportions && <Link2 className="w-2.5 h-2.5 text-blue-500" />}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepDimension('depth', -25)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStepDimension('depth', 25)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="25"
                    value={selectedFurniture.depth}
                    onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 100)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              {/* Height */}
              <div className={`p-2 bg-white rounded border transition-colors ${lockProportions ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                    HEIGHT (H)
                    {lockProportions && <Link2 className="w-2.5 h-2.5 text-blue-500" />}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepDimension('height', -50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStepDimension('height', 50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="25"
                    value={selectedFurniture.height}
                    onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 100)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              {/* Elevation Z */}
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">ELEVATION (Z)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepDimension('z', -50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStepDimension('z', 50)}
                      className="w-4 h-4 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="25"
                    value={selectedFurniture.z || 0}
                    onChange={(e) => handleDimensionChange('z', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-blue-600 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Materials & Color Swatches */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-widest">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Finish & Color Palette</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Shutter Color Swatches */}
            <div>
              <label className="text-slate-600 text-[11px] block mb-1.5 font-medium">Shutter Color & Finish</label>
              <div className="grid grid-cols-4 gap-1.5">
                {MATERIAL_PALETTE_STRUCTURED.shutters.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => {
                      handleMaterialChange('shutterFinish', mat.name);
                      handleMaterialChange('shutterColor', mat.color);
                    }}
                    style={{ backgroundColor: mat.color }}
                    className={`h-7 rounded border-2 transition-transform ${
                      selectedFurniture.materials.shutterColor === mat.color
                        ? 'border-blue-600 scale-105 shadow-md'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    title={mat.name}
                  />
                ))}
              </div>
            </div>

            {/* Carcass Material */}
            <div>
              <label className="text-slate-600 text-[11px] block mb-1 font-medium">Carcass Core Board</label>
              <select
                value={selectedFurniture.materials.carcassMaterial}
                onChange={(e) => handleMaterialChange('carcassMaterial', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
              >
                {MATERIAL_PALETTE_STRUCTURED.carcass.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 7. Hardware Auto-Calculation Summary */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-widest text-[10px] mb-1">
            <Wrench className="w-3 h-3 text-amber-600" />
            <span>Auto Hardware Calculation</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Soft-Close Hinges:</span>
            <span className="text-slate-900 font-bold">{selectedFurniture.parametric.hingesCount || 0} pairs</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tandem Slides:</span>
            <span className="text-slate-900 font-bold">{selectedFurniture.parametric.slidePairs || 0} pairs</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Handles:</span>
            <span className="text-slate-900 font-bold">{selectedFurniture.parametric.handlesCount || 0} nos</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>PVC Leveler Legs:</span>
            <span className="text-slate-900 font-bold">{selectedFurniture.parametric.legsCount || 4} nos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
