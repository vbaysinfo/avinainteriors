'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectInfo, Room } from '../types/cad';
import { calculateRoomArea, calculateProjectArea } from '../utils/areaCalculations';
import { Plus, Home, Trash2, Edit2, Check, X, Building2, ChevronDown, Layers, CheckCircle2 } from 'lucide-react';

interface RoomTabsBarProps {
  project: ProjectInfo;
  activeRoom: Room;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const RoomTabsBar: React.FC<RoomTabsBarProps> = ({
  project,
  activeRoom,
  onSelectRoom,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
}) => {
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [showAreaPopover, setShowAreaPopover] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const projectArea = calculateProjectArea(project);
  const activeRoomMetrics = calculateRoomArea(activeRoom);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAreaPopover(false);
      }
    };
    if (showAreaPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAreaPopover]);

  const handleStartRename = (e: React.MouseEvent, r: Room) => {
    e.stopPropagation();
    setEditingRoomId(r.id);
    setEditingName(r.name);
  };

  const handleSaveRename = (e: React.MouseEvent, r: Room) => {
    e.stopPropagation();
    if (editingName.trim()) {
      onUpdateRoom({ ...r, name: editingName.trim() });
    }
    setEditingRoomId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoomId(null);
  };

  return (
    <div className="h-10 px-3 sm:px-4 flex items-center justify-between select-none z-20 flex-shrink-0 border-b bg-slate-50 border-slate-200 text-slate-700 transition-colors">
      {/* Left: Active Room Tabs list with individual Room Sq.Ft */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-380px)]">
        <span className="text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0 text-slate-500">
          <Home className="w-3.5 h-3.5 text-blue-600" />
          <span>Rooms:</span>
        </span>

        {project.rooms.map((r) => {
          const isActive = r.id === activeRoom.id;
          const isEditing = editingRoomId === r.id;
          const furnitureCount = r.furniture ? r.furniture.length : 0;
          const roomArea = calculateRoomArea(r);

          if (isEditing) {
            return (
              <div
                key={r.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs shadow-sm bg-white border-blue-500 text-slate-800"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(e as any, r);
                    if (e.key === 'Escape') setEditingRoomId(null);
                  }}
                  autoFocus
                  className="text-xs px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-800 w-28 focus:outline-none font-medium"
                />
                <button
                  onClick={(e) => handleSaveRename(e, r)}
                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                  title="Save Name"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelRename}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={r.id}
              onClick={() => onSelectRoom(r.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border flex-shrink-0 ${
                isActive
                  ? 'bg-white text-blue-700 border-blue-400 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-white border-slate-200'
              }`}
              title={`${r.name} (${roomArea.formattedDimensionsMm} • ${roomArea.formattedSqFt} sq.ft / ${roomArea.formattedSqM} m²)`}
            >
              <span className="truncate max-w-[110px]">{r.name}</span>

              {/* Room Area in Sq.Ft Pill */}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {roomArea.formattedSqFt} sq.ft
              </span>

              {/* Furniture count pill */}
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
                title={`${furnitureCount} modular units`}
              >
                {furnitureCount}
              </span>

              {/* Action buttons on tab */}
              <button
                onClick={(e) => handleStartRename(e, r)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-700 text-slate-400 transition-opacity"
                title="Rename Room"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>

              {project.rooms.length > 1 && onDeleteRoom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete room "${r.name}"?`)) {
                      onDeleteRoom(r.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 text-slate-400 transition-opacity"
                  title="Delete Room"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddRoom}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-blue-600 shadow-sm text-xs font-semibold transition-all flex-shrink-0 cursor-pointer"
          title="Add New Room to Project"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>New Room</span>
        </button>
      </div>

      {/* Right: Area Breakdown Widget & Active Room Specs */}
      <div className="flex items-center gap-2 relative">
        {/* Project Total Carpet Area Popover Trigger Button */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowAreaPopover((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              showAreaPopover
                ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/30'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
            }`}
            title="Click to view full room-by-room square feet & project area breakdown"
          >
            <Building2 className={`w-3.5 h-3.5 ${showAreaPopover ? 'text-white' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">Project Total:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-300" style={{ color: showAreaPopover ? '#ffffff' : undefined }}>
              {projectArea.formattedTotalSqFt} sq.ft
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${showAreaPopover ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {projectArea.totalRooms} {projectArea.totalRooms === 1 ? 'Room' : 'Rooms'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAreaPopover ? 'rotate-180 text-white' : 'text-slate-400'}`} />
          </button>

          {/* Area Breakdown Dropdown Popover */}
          {showAreaPopover && (
            <div className="absolute right-0 top-11 w-84 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Project Area Breakdown</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{project.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAreaPopover(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Total Project Area Highlight Box */}
              <div className="my-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">Total Carpet Area</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-blue-950">{projectArea.formattedTotalSqFt}</span>
                    <span className="text-xs font-semibold text-blue-800">sq.ft</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Metric Area</span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-sm font-bold font-mono text-slate-800">{projectArea.formattedTotalSqM}</span>
                    <span className="text-[11px] text-slate-600">m²</span>
                  </div>
                </div>
              </div>

              {/* Room Breakdown List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between px-1">
                  <span>Room Details</span>
                  <span>Square Feet & Share</span>
                </div>

                {projectArea.rooms.map((rm) => {
                  const isCurrent = rm.roomId === activeRoom.id;
                  return (
                    <div
                      key={rm.roomId}
                      onClick={() => {
                        onSelectRoom(rm.roomId);
                        setShowAreaPopover(false);
                      }}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400/30'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                          <span className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                            {rm.roomName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {rm.formattedDimensionsMm} ({rm.formattedDimensionsFt})
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-xs font-bold font-mono text-slate-900">{rm.formattedSqFt}</span>
                          <span className="text-[10px] text-slate-600 font-medium">sq.ft</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-slate-500">
                          <span>{rm.formattedSqM} m²</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-600">{rm.percentageOfProject}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Active: <strong className="text-slate-800">{activeRoom.name}</strong></span>
                <span className="text-blue-600 font-bold">{activeRoomMetrics.formattedSqFt} sq.ft</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Room Specifications Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono border-l border-slate-200 pl-2.5 text-slate-600">
          <span className="font-semibold text-blue-700">
            {activeRoomMetrics.formattedDimensionsMm}
          </span>
          <span className="text-slate-300">|</span>
          <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
            {activeRoomMetrics.formattedSqFt} sq.ft
          </span>
          <span className="text-slate-400 text-[11px]">
            ({activeRoomMetrics.formattedSqM} m²)
          </span>
        </div>
      </div>
    </div>
  );
};

