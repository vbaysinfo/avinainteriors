'use client';

import React from 'react';
import { ProjectInfo, Room, CadViewMode } from '../types/cad';
import { exportToDXF, downloadFile } from '../utils/cadExport';
import { calculateProjectArea } from '../utils/areaCalculations';
import {
  Sparkles,
  LayoutGrid,
  Columns,
  Layers,
  Box,
  FileSpreadsheet,
  Download,
  FolderPlus,
  Plus,
  Compass,
  ChevronDown,
  Eraser,
  Building2,
} from 'lucide-react';

interface HeaderNavProps {
  project: ProjectInfo;
  activeRoom: Room;
  viewMode: CadViewMode;
  onViewModeChange: (mode: CadViewMode) => void;
  onSelectRoom: (roomId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenSketchUploadModal: () => void;
  onOpenExcelImportModal?: () => void;
  onOpenSketchUpModal?: () => void;
  onOpenClearModal?: () => void;
  onAddRoom: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  project,
  activeRoom,
  viewMode,
  onViewModeChange,
  onSelectRoom,
  onOpenNewProjectModal,
  onOpenSketchUploadModal,
  onOpenExcelImportModal,
  onOpenSketchUpModal,
  onOpenClearModal,
  onAddRoom,
}) => {
  const projectArea = calculateProjectArea(project);

  const handleExportDXF = () => {
    const dxfContent = exportToDXF(project, activeRoom);
    const filename = `${project.name.replace(/\s+/g, '_')}_${activeRoom.name}_2D_AutoCAD.dxf`;
    downloadFile(filename, dxfContent, 'application/dxf');
  };

  return (
    <header className="h-13 px-4 flex items-center justify-between z-30 select-none flex-shrink-0 border-b bg-white border-slate-200 text-slate-800 shadow-sm transition-colors">
      {/* Left: Brand & Project Selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* App Title Badge */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold leading-none tracking-wide uppercase text-slate-900">
                MODULAR CAD PRO
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 uppercase font-mono">
                v2.5
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider leading-tight mt-0.5 text-slate-500 font-medium">
              {project.name.slice(0, 22)}
            </span>
          </div>
        </div>

        {/* Room Switcher Dropdown */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center">
            <select
              value={activeRoom.id}
              onChange={(e) => onSelectRoom(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 hover:border-slate-400 rounded-lg pl-2.5 pr-7 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              {project.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500" />
          </div>

          <button
            onClick={onAddRoom}
            className="p-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-sm text-xs transition-colors"
            title="Add Another Room"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project & Client Subtitle with Total Sq.Ft Badge */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono border-l border-slate-200 pl-3 text-slate-500">
          <span className="font-semibold text-slate-700">
            {project.customerName}
          </span>
          <span className="text-slate-400">
            [{project.projectType}]
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold" title="Total Project Carpet Area">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>{projectArea.formattedTotalSqFt} sq.ft</span>
            <span className="text-slate-400 font-normal">({projectArea.totalRooms} rms)</span>
          </span>
        </div>
      </div>

      {/* Center: Multi-View Switching Tabs */}
      <div className="flex items-center p-1 rounded-xl border border-slate-200/80 bg-slate-100/80 gap-1 text-xs shadow-inner transition-colors">
        <button
          onClick={() => onViewModeChange('2D_PLAN')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === '2D_PLAN'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
          title="2D Floor Plan CAD Layout"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>2D Floor Plan</span>
        </button>

        <button
          onClick={() => onViewModeChange('ELEVATION')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'ELEVATION'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
          }`}
          title="Front View & Wall Elevations (Critical Elevation Drafting)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Front Elevation</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              viewMode === 'ELEVATION'
                ? 'bg-blue-700/60 text-white'
                : 'bg-amber-200 text-amber-900'
            }`}
          >
            ELEV
          </span>
        </button>

        <button
          onClick={() => onViewModeChange('SECTION')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'SECTION'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
          title="Section A-A Cut View"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Section A-A</span>
        </button>

        <button
          onClick={() => onViewModeChange('3D_VIEW')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === '3D_VIEW'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
          title="3D WebGL Studio Render"
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Studio</span>
        </button>

        <button
          onClick={() => onViewModeChange('CUTTING_LIST')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'CUTTING_LIST'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
          title="MaxCut Cutting List & BOM Panel Generation"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Cutting List & BOM</span>
        </button>
      </div>

      {/* Right: Actions & Export */}
      <div className="flex items-center gap-2">
        {/* Upload Excel Measurements Layout Button */}
        {onOpenExcelImportModal && (
          <button
            onClick={onOpenExcelImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-sm font-semibold transition-all cursor-pointer"
            title="Upload Excel sheet (.xlsx / .csv) with room & furniture measurements to auto-design CAD layouts"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Excel</span>
          </button>
        )}

        {/* Upload Hand Drawing Button */}
        <button
          onClick={onOpenSketchUploadModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 shadow-sm font-semibold transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>AI Site Sketch</span>
        </button>

        {/* Export AutoCAD DXF */}
        <button
          onClick={handleExportDXF}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-sm font-semibold transition-all cursor-pointer"
          title="Export AutoCAD DXF 2D Drawing"
        >
          <Download className="w-3.5 h-3.5 text-blue-500" />
          <span>AutoCAD DXF</span>
        </button>

        {/* Export SketchUp (.SKP) */}
        <button
          onClick={onOpenSketchUpModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 shadow-sm font-semibold transition-all cursor-pointer"
          title="Export 3D Models to SketchUp (.SKP) with Parametric Data Mapping"
        >
          <Box className="w-3.5 h-3.5 text-red-500" />
          <span>SketchUp (.SKP)</span>
        </button>

        {/* Clear Canvas / Start Fresh Action Button */}
        {onOpenClearModal && (
          <button
            onClick={onOpenClearModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs rounded-lg font-bold shadow-xs transition-all cursor-pointer"
            title="Clear 2D Layout Canvas Data / Reset to Blank Room or Start Fresh Project"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear Canvas</span>
          </button>
        )}

        {/* New Project Modal Trigger */}
        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
          title="New Project & Room Templates"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Project</span>
        </button>
      </div>
    </header>
  );
};
