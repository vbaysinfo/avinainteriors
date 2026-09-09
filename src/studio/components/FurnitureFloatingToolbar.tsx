'use client';

import React from 'react';
import { FurnitureItem, Room } from '../types/cad';
import { recalculateParametricFurniture } from '../utils/parametricEngine';
import { FurnitureCollisionInfo, clampItemToRoomBounds } from '../utils/collisionEngine';
import {
  RotateCw,
  Trash2,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Layers,
  X,
  Sparkles,
  Sliders,
  ChevronDown,
  Box,
  LayoutGrid,
  Maximize2,
  Armchair,
  Columns,
  DoorClosed,
  Tv,
  Bed,
  ArrowUp,
  Ruler,
  AlertTriangle,
  CornerDownRight,
} from 'lucide-react';

interface FurnitureFloatingToolbarProps {
  furniture: FurnitureItem;
  room: Room;
  collisionInfo?: FurnitureCollisionInfo;
  onUpdateRoom: (room: Room) => void;
  onDeselect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onMirror: (axis: 'horizontal' | 'vertical') => void;
}

export const FurnitureFloatingToolbar: React.FC<FurnitureFloatingToolbarProps> = ({
  furniture,
  room,
  collisionInfo,
  onUpdateRoom,
  onDeselect,
  onDelete,
  onDuplicate,
  onRotate,
  onMirror,
}) => {
  const parametric = furniture.parametric;

  // Auto-clamp item to stay inside room boundaries
  const handleAutoClampToBounds = () => {
    const clamped = clampItemToRoomBounds(furniture, room.widthMm, room.depthMm);
    const recalculated = recalculateParametricFurniture(clamped);
    const newFurnitureList = room.furniture.map((f) => (f.id === furniture.id ? recalculated : f));
    onUpdateRoom({ ...room, furniture: newFurnitureList });
  };

  // Helper to update parametric properties
  const handleUpdateParametric = (changes: Partial<typeof furniture.parametric>) => {
    const updated: FurnitureItem = {
      ...furniture,
      parametric: {
        ...furniture.parametric,
        ...changes,
      },
    };
    const recalculated = recalculateParametricFurniture(updated);
    const newFurnitureList = room.furniture.map((f) => (f.id === furniture.id ? recalculated : f));
    onUpdateRoom({ ...room, furniture: newFurnitureList });
  };

  // Helper to update dimensions & elevation Z
  const handleUpdateDimension = (field: 'width' | 'depth' | 'height' | 'z', delta: number) => {
    let newVal = Math.max(50, (furniture[field] || 0) + delta);
    if (field === 'z') newVal = Math.max(0, (furniture.z || 0) + delta);

    const updated: FurnitureItem = {
      ...furniture,
      [field]: newVal,
    };
    const recalculated = recalculateParametricFurniture(updated);
    const newFurnitureList = room.furniture.map((f) => (f.id === furniture.id ? recalculated : f));
    onUpdateRoom({ ...room, furniture: newFurnitureList });
  };

  // Set elevation preset
  const handleSetElevation = (zValue: number) => {
    const updated: FurnitureItem = {
      ...furniture,
      z: zValue,
    };
    const recalculated = recalculateParametricFurniture(updated);
    const newFurnitureList = room.furniture.map((f) => (f.id === furniture.id ? recalculated : f));
    onUpdateRoom({ ...room, furniture: newFurnitureList });
  };

  // Category Icon & Color
  const getCategoryBadge = () => {
    switch (furniture.category) {
      case 'below_overhead':
        return { label: '1ft Below Overhead', icon: LayoutGrid, color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'sitting':
        return { label: 'Sitting Box', icon: Armchair, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'vertical_box':
        return { label: 'Vertical Tower', icon: Columns, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'kitchen':
        return { label: 'Kitchen Unit', icon: Box, color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'wardrobe':
        return { label: 'Wardrobe', icon: DoorClosed, color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'tv_unit':
        return { label: 'TV Console', icon: Tv, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'bed':
        return { label: 'Bed & Living', icon: Bed, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Modular Unit', icon: Box, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getCategoryBadge();
  const CategoryIcon = badge.icon;

  const shutterCount = parametric.shutterCount ?? 1;
  const shelfCount = parametric.shelfCount ?? 0;
  const drawerCount = parametric.drawerCount ?? 0;
  const shutterType = parametric.shutterType ?? 'hinged';
  const handleType = parametric.handleType ?? 'g_profile';

  return (
    <div
      id="furniture-context-toolbar"
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 max-w-[96vw] w-auto text-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-150 select-none"
    >
      {/* Collision & Placement Conflict Alert Strip */}
      {collisionInfo?.hasCollision && (
        <div className="mb-2 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-rose-700 text-xs font-semibold animate-pulse">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">
              {collisionInfo.primaryReason || 'Placement conflict detected (overlap or out of bounds)'}
            </span>
          </div>
          {collisionInfo.isOutOfBounds && (
            <button
              onClick={handleAutoClampToBounds}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
              title="Automatically reposition within room boundary walls"
            >
              Fit in Room
            </button>
          )}
        </div>
      )}

      {/* Top Header Row: Item Info & Dimensions */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${badge.color}`}>
            <CategoryIcon className="w-3 h-3" />
            <span>{badge.label}</span>
          </span>
          <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]" title={furniture.name}>
            {furniture.name.split(' (')[0]}
          </span>
        </div>

        {/* Dimension Chips with Quick Adjusters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Width */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] font-mono">
            <span className="text-slate-400 font-sans text-[10px] mr-1">W:</span>
            <button
              onClick={() => handleUpdateDimension('width', -50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Decrease Width (-50mm)"
            >
              -
            </button>
            <span className="font-bold text-slate-900 px-0.5">{furniture.width}</span>
            <button
              onClick={() => handleUpdateDimension('width', 50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Increase Width (+50mm)"
            >
              +
            </button>
            <span className="text-[9px] text-slate-400 ml-0.5">mm</span>
          </div>

          {/* Depth */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] font-mono">
            <span className="text-slate-400 font-sans text-[10px] mr-1">D:</span>
            <button
              onClick={() => handleUpdateDimension('depth', -50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Decrease Depth (-50mm)"
            >
              -
            </button>
            <span className="font-bold text-slate-900 px-0.5">{furniture.depth}</span>
            <button
              onClick={() => handleUpdateDimension('depth', 50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Increase Depth (+50mm)"
            >
              +
            </button>
            <span className="text-[9px] text-slate-400 ml-0.5">mm</span>
          </div>

          {/* Height */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] font-mono">
            <span className="text-slate-400 font-sans text-[10px] mr-1">H:</span>
            <button
              onClick={() => handleUpdateDimension('height', -50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Decrease Height (-50mm)"
            >
              -
            </button>
            <span className="font-bold text-slate-900 px-0.5">{furniture.height}</span>
            <button
              onClick={() => handleUpdateDimension('height', 50)}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              title="Increase Height (+50mm)"
            >
              +
            </button>
            <span className="text-[9px] text-slate-400 ml-0.5">mm</span>
          </div>

          {/* Elevation Z */}
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-1.5 py-0.5 text-[11px] font-mono text-blue-900">
            <span className="text-blue-500 font-sans text-[10px] mr-1">Z:</span>
            <button
              onClick={() => handleUpdateDimension('z', -50)}
              className="px-1 text-blue-600 hover:text-blue-950 font-bold cursor-pointer"
              title="Lower Elevation (-50mm)"
            >
              -
            </button>
            <span className="font-bold text-blue-900 px-0.5">+{furniture.z || 0}</span>
            <button
              onClick={() => handleUpdateDimension('z', 50)}
              className="px-1 text-blue-600 hover:text-blue-950 font-bold cursor-pointer"
              title="Raise Elevation (+50mm)"
            >
              +
            </button>
          </div>

          {/* Deselect */}
          <button
            onClick={onDeselect}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            title="Deselect [Esc]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body Row: Parametric Shutter, Shelf & Hardware Steppers + Action Tools */}
      <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
        {/* Shutter & Shelves Detailing Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shutters Stepper */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[11px] font-medium text-slate-600">Shutters:</span>
            <button
              onClick={() => handleUpdateParametric({ shutterCount: Math.max(0, shutterCount - 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Decrease Shutters"
            >
              -
            </button>
            <span className="font-mono font-bold text-slate-900 text-xs w-4 text-center">
              {shutterCount}
            </span>
            <button
              onClick={() => handleUpdateParametric({ shutterCount: Math.min(8, shutterCount + 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Increase Shutters"
            >
              +
            </button>
          </div>

          {/* Shutter Type Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg">
            <span className="text-[10px] font-medium text-slate-500">Style:</span>
            <select
              value={shutterType}
              onChange={(e) => handleUpdateParametric({ shutterType: e.target.value as any })}
              className="bg-white text-[11px] font-semibold text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="hinged">Hinged</option>
              <option value="sliding">Sliding</option>
              <option value="liftup">Lift-Up</option>
              <option value="glass">Glass</option>
              <option value="fluted">Fluted</option>
              <option value="open">Open (No Door)</option>
            </select>
          </div>

          {/* Shelves Stepper */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[11px] font-medium text-slate-600">Shelves:</span>
            <button
              onClick={() => handleUpdateParametric({ shelfCount: Math.max(0, shelfCount - 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Decrease Shelves"
            >
              -
            </button>
            <span className="font-mono font-bold text-slate-900 text-xs w-4 text-center">
              {shelfCount}
            </span>
            <button
              onClick={() => handleUpdateParametric({ shelfCount: Math.min(8, shelfCount + 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Increase Shelves"
            >
              +
            </button>
          </div>

          {/* Drawers / Baskets Stepper */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[11px] font-medium text-slate-600">Drawers/Baskets:</span>
            <button
              onClick={() => handleUpdateParametric({ drawerCount: Math.max(0, drawerCount - 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Decrease Drawers/Baskets"
            >
              -
            </button>
            <span className="font-mono font-bold text-slate-900 text-xs w-4 text-center">
              {drawerCount}
            </span>
            <button
              onClick={() => handleUpdateParametric({ drawerCount: Math.min(6, drawerCount + 1) })}
              className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold leading-none cursor-pointer"
              title="Increase Drawers/Baskets"
            >
              +
            </button>
          </div>

          {/* Handle Profile Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg">
            <span className="text-[10px] font-medium text-slate-500">Handle:</span>
            <select
              value={handleType}
              onChange={(e) => handleUpdateParametric({ handleType: e.target.value as any })}
              className="bg-white text-[11px] font-semibold text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="g_profile">G-Profile</option>
              <option value="edge_lip">Edge Lip</option>
              <option value="push_to_open">Push-to-Open</option>
              <option value="concealed">Concealed</option>
              <option value="bar">Bar Handle</option>
            </select>
          </div>

          {/* Quick Elevation Level Presets */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-lg text-[10px]">
            <span className="text-slate-400 px-1 font-medium">Level:</span>
            <button
              onClick={() => handleSetElevation(0)}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                furniture.z === 0 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Floor Level (0mm)"
            >
              Base (0)
            </button>
            <button
              onClick={() => handleSetElevation(1100)}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                furniture.z === 1100 ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Under-Cabinet Mid-Wall (1100mm)"
            >
              1ft Mid (1100)
            </button>
            <button
              onClick={() => handleSetElevation(1400)}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                furniture.z === 1400 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Overhead Wall Unit (1400mm)"
            >
              Wall (1400)
            </button>
            <button
              onClick={() => handleSetElevation(2100)}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                furniture.z === 2100 ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Loft Level (2100mm)"
            >
              Loft (2100)
            </button>
          </div>
        </div>

        {/* Spatial Transformation Tools */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          {/* Rotate */}
          <button
            onClick={onRotate}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Rotate 90° [R]"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Rotate</span>
          </button>

          {/* Mirror H */}
          <button
            onClick={() => onMirror('horizontal')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Mirror Horizontally (Flip H) [Shift+H]"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Flip H</span>
          </button>

          {/* Mirror V */}
          <button
            onClick={() => onMirror('vertical')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Mirror Vertically (Flip V) [Shift+V]"
          >
            <FlipVertical className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Flip V</span>
          </button>

          {/* Copy */}
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Duplicate Object"
          >
            <Copy className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden md:inline">Copy</span>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Delete Object [Del / Backspace]"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
