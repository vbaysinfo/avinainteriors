'use client';

import React, { useState } from 'react';
import { Room, ProjectInfo } from '../types/cad';
import { Trash2, RotateCcw, AlertTriangle, Eraser, LayoutGrid, FolderPlus, X } from 'lucide-react';

interface ClearCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: Room;
  project: ProjectInfo;
  onClearFurnitureOnly: () => void;
  onClearEntireRoomCanvas: () => void;
  onStartFreshProject: () => void;
}

export const ClearCanvasModal: React.FC<ClearCanvasModalProps> = ({
  isOpen,
  onClose,
  activeRoom,
  project,
  onClearFurnitureOnly,
  onClearEntireRoomCanvas,
  onStartFreshProject,
}) => {
  const [activeTab, setActiveTab] = useState<'room' | 'project'>('room');

  if (!isOpen) return null;

  const furnitureCount = activeRoom.furniture ? activeRoom.furniture.length : 0;
  const doorsCount = activeRoom.doors ? activeRoom.doors.length : 0;
  const windowsCount = activeRoom.windows ? activeRoom.windows.length : 0;
  const totalItemsCount = furnitureCount + doorsCount + windowsCount + (activeRoom.columns?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
              <Eraser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Clear Canvas &amp; Start Fresh
              </h2>
              <p className="text-xs text-slate-500">
                Choose to clear 2D layout canvas data or start a completely new project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-xs hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1">
          <button
            onClick={() => setActiveTab('room')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'room'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            <span>Clear Current Room ({activeRoom.name})</span>
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'project'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-red-600" />
            <span>Reset Entire Project</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'room' ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Active Room Data: </strong>
                  <span>
                    Currently has <strong>{furnitureCount}</strong> furniture modules,{' '}
                    <strong>{doorsCount}</strong> doors, and <strong>{windowsCount}</strong> windows.
                  </span>
                </div>
              </div>

              {/* Action 1: Clear All Furniture & Modules Only */}
              <div className="border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 transition-all bg-white hover:bg-blue-50/30 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-blue-600" />
                    Clear All Furniture &amp; Cabinets
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Removes all wardrobes, kitchen cabinets, units, and accessories from this room while preserving walls and openings.
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClearFurnitureOnly();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex-shrink-0 cursor-pointer"
                >
                  Clear Furniture ({furnitureCount})
                </button>
              </div>

              {/* Action 2: Clear Entire Room (Blank Canvas) */}
              <div className="border border-red-200 hover:border-red-400 rounded-xl p-3.5 transition-all bg-red-50/20 hover:bg-red-50/50 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                    <Eraser className="w-3.5 h-3.5 text-red-600" />
                    Wipe Room 2D Canvas (Fresh Room)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Clears all {totalItemsCount} items (furniture, doors, windows, columns, text) and leaves clean perimeter walls.
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClearEntireRoomCanvas();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex-shrink-0 cursor-pointer"
                >
                  Wipe Room Canvas
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Reset Entire Project: </strong>
                  <span>
                    This will delete all <strong>{project.rooms.length} rooms</strong> in &quot;{project.name}&quot; and launch a fresh, pristine project.
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Current Project:</span>
                  <strong className="text-slate-900">{project.name}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Client / Customer:</span>
                  <strong className="text-slate-900">{project.customerName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Rooms:</span>
                  <strong className="text-slate-900">{project.rooms.length} Rooms</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  onStartFreshProject();
                  onClose();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Confirm &amp; Start New Fresh Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
