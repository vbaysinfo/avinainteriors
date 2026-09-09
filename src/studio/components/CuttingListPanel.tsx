'use client';

import React, { useState } from 'react';
import { ProjectInfo, Room } from '../types/cad';
import { generateCuttingList, calculateQuotation, calculateMaterialUsage } from '../utils/parametricEngine';
import { exportToExcel, downloadFile } from '../utils/cadExport';
import { calculateRoomArea, calculateProjectArea } from '../utils/areaCalculations';
import {
  Download,
  FileSpreadsheet,
  Layers,
  DollarSign,
  Wrench,
  Box,
  ChevronDown,
  ChevronUp,
  Ruler,
  CheckCircle2,
  Package,
  Layers as LayersIcon,
  Building2,
  Home,
} from 'lucide-react';

interface CuttingListPanelProps {
  project: ProjectInfo;
  activeRoom: Room;
}

export const CuttingListPanel: React.FC<CuttingListPanelProps> = ({ project, activeRoom }) => {
  const [activeTab, setActiveTab] = useState<'cutting_list' | 'materials' | 'hardware' | 'quotation'>('cutting_list');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const cuttingItems = generateCuttingList(activeRoom.furniture);
  const quotation = calculateQuotation(activeRoom.furniture);
  const materials = calculateMaterialUsage(activeRoom.furniture);

  const filteredItems = selectedFilter === 'all'
    ? cuttingItems
    : cuttingItems.filter((i) => i.parentFurnitureId === selectedFilter);

  const handleExportExcel = () => {
    exportToExcel(project, activeRoom);
  };

  const handleExportCSV = () => {
    let csv = 'Part Name,Parent Furniture,Category,Quantity,Length (mm),Width (mm),Thickness (mm),Material,Finish,EB Top,EB Bottom,EB Left,EB Right,Remarks\n';
    cuttingItems.forEach((i) => {
      csv += `"${i.partName}","${i.parentFurnitureName}","${i.category}",${i.qty},${i.length},${i.width},${i.thickness},"${i.material}","${i.finish}",${i.edgeBandingSides.top ? i.edgeBandingThickness : 0},${i.edgeBandingSides.bottom ? i.edgeBandingThickness : 0},${i.edgeBandingSides.left ? i.edgeBandingThickness : 0},${i.edgeBandingSides.right ? i.edgeBandingThickness : 0},"${i.remarks || ''}"\n`;
    });
    const filename = `${project.name.replace(/\s+/g, '_')}_${activeRoom.name}_MaxCut_Panels.csv`;
    downloadFile(filename, csv, 'text/csv');
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none bg-slate-100 text-slate-800">
      {/* Header Toolbar */}
      <div className="h-12 border-b px-4 flex items-center justify-between z-10 bg-white border-slate-200 text-slate-800 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('cutting_list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'cutting_list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cutting List (MaxCut)</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                activeTab === 'cutting_list' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {cuttingItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'materials'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Material & Sheet Usage</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                activeTab === 'materials' ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {materials.sheets.totalCoreSheets8x4} Sheets | {materials.edgeBanding.totalRunningMeters}m EB
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'hardware'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Hardware Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('quotation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'quotation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Quotation & BOM (₹{quotation.totalCost.toLocaleString()})</span>
          </button>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon for Quick Overview */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Cut Panels</span>
            <span className="font-bold text-slate-900 text-sm">{materials.totalPieces} Pieces</span>
            <span className="text-[10px] text-slate-500 ml-1">in {materials.totalFurnitureUnits} units</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Core Plywood Sheets (8'×4')</span>
            <span className="font-bold text-amber-700 text-sm">{materials.sheets.totalCoreSheets8x4} Sheets</span>
            <span className="text-[10px] text-slate-500 ml-1">({materials.sheets.carcass18mm.sheets8x4} Carcass + {materials.sheets.backPly8mm.sheets8x4} Back)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
            <LayersIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Laminate Sheets (8'×4')</span>
            <span className="font-bold text-purple-700 text-sm">{materials.laminates.totalLaminateSheets8x4} Sheets</span>
            <span className="text-[10px] text-slate-500 ml-1">({materials.laminates.innerLiner08mm.sheets8x4} Liner + {materials.laminates.outerDecorative1mm.sheets8x4} Outer)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Edge Binding (Total)</span>
            <span className="font-bold text-emerald-700 text-sm">{materials.edgeBanding.totalRunningMeters} Meters</span>
            <span className="text-[10px] text-slate-500 ml-1">({materials.edgeBanding.carcassEB08mm.grossMeters}m 0.8 + {materials.edgeBanding.shutterEB20mm.grossMeters}m 2.0)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 1: CUTTING LIST */}
        {activeTab === 'cutting_list' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  Filter by Unit:
                </span>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border bg-slate-50 border-slate-300 text-slate-900"
                >
                  <option value="all">All Furniture Units ({activeRoom.furniture.length})</option>
                  {activeRoom.furniture.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-mono text-slate-500">
                Format: <span className="text-blue-600 font-semibold">MaxCut v2 / Ardis / Woodwop CNC Ready</span>
              </span>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden border shadow-sm bg-white border-slate-200">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b font-semibold bg-slate-100 border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Part Description</th>
                    <th className="p-3">Parent Unit</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Length (mm)</th>
                    <th className="p-3 text-right">Width (mm)</th>
                    <th className="p-3 text-right">Thick (mm)</th>
                    <th className="p-3">Material & Finish</th>
                    <th className="p-3 text-center">Edge Band (T/B/L/R)</th>
                    <th className="p-3">CNC Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {item.partName}
                      </td>
                      <td className="p-3 text-blue-600 font-semibold">{item.parentFurnitureName}</td>
                      <td className="p-3 text-center font-bold text-amber-600">{item.qty}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {item.length}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {item.width}
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {item.thickness} mm
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">
                          {item.material}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {item.finish}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border font-semibold bg-slate-100 border-slate-200 text-slate-700">
                          {item.edgeBandingSides.top ? 'T' : '-'}
                          {item.edgeBandingSides.bottom ? 'B' : '-'}
                          {item.edgeBandingSides.left ? 'L' : '-'}
                          {item.edgeBandingSides.right ? 'R' : '-'} ({item.edgeBandingThickness}mm)
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {item.remarks || 'Standard Trim'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MATERIAL USAGE & SHEET OPTIMIZATION */}
        {activeTab === 'materials' && (
          <div className="space-y-6 max-w-6xl">
            {/* 1. Commercial Core Plywood Sheets (8'x4') */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-amber-500 rounded-xs" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    1. Commercial Plywood & Core Board Sheets (8ft × 4ft / 2440 × 1220 mm)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                  Total Core Boards: {materials.sheets.totalCoreSheets8x4} Sheets
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 18mm Carcass */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      18mm Carcass Plywood
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold font-mono text-xs rounded">
                      {materials.sheets.carcass18mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.sheets.carcass18mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Net Surface Area:</span>
                      <span className="font-bold text-slate-800">{materials.sheets.carcass18mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>CNC Nesting Wastage (+12%):</span>
                      <span>{materials.sheets.carcass18mm.grossSqFt} Sq.Ft gross</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheet (32 SqFt):</span>
                      <span className="font-bold text-blue-600">{materials.sheets.carcass18mm.sheets8x4} Full Sheets</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Alternative 7'×4' (28 SqFt):</span>
                      <span>{materials.sheets.carcass18mm.sheets7x4} Sheets</span>
                    </div>
                  </div>
                </div>

                {/* 8mm Back Ply */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      8mm Backing Ply
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold font-mono text-xs rounded">
                      {materials.sheets.backPly8mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.sheets.backPly8mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Net Surface Area:</span>
                      <span className="font-bold text-slate-800">{materials.sheets.backPly8mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Trimming Wastage (+10%):</span>
                      <span>{materials.sheets.backPly8mm.grossSqFt} Sq.Ft gross</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheet (32 SqFt):</span>
                      <span className="font-bold text-blue-600">{materials.sheets.backPly8mm.sheets8x4} Full Sheets</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Alternative 7'×4' (28 SqFt):</span>
                      <span>{materials.sheets.backPly8mm.sheets7x4} Sheets</span>
                    </div>
                  </div>
                </div>

                {/* 18mm Shutter Boards */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      18mm Shutter Core
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold font-mono text-xs rounded">
                      {materials.sheets.shutterBoard18mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.sheets.shutterBoard18mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Net Surface Area:</span>
                      <span className="font-bold text-slate-800">{materials.sheets.shutterBoard18mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Door Saw Allowance (+10%):</span>
                      <span>{materials.sheets.shutterBoard18mm.grossSqFt} Sq.Ft gross</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheet (32 SqFt):</span>
                      <span className="font-bold text-blue-600">{materials.sheets.shutterBoard18mm.sheets8x4} Full Sheets</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Alternative 7'×4' (28 SqFt):</span>
                      <span>{materials.sheets.shutterBoard18mm.sheets7x4} Sheets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Laminate Sheets & Surface Coatings (8'x4') */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-purple-500 rounded-xs" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    2. Decorative Laminates & Balancing Liner Sheets (8ft × 4ft)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
                  Total Laminates: {materials.laminates.totalLaminateSheets8x4} Sheets
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 0.8mm Inner Liner */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      0.8mm Inner Liner
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold font-mono text-xs rounded">
                      {materials.laminates.innerLiner08mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.laminates.innerLiner08mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Carcass 2-Face Area:</span>
                      <span className="font-bold text-slate-800">{materials.laminates.innerLiner08mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>With Trimming (+10%):</span>
                      <span>{materials.laminates.innerLiner08mm.grossSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheets:</span>
                      <span className="font-bold text-purple-700">{materials.laminates.innerLiner08mm.sheets8x4} Sheets</span>
                    </div>
                  </div>
                </div>

                {/* 1.0mm Decorative */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      1.0mm Decorative / Acrylic
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold font-mono text-xs rounded">
                      {materials.laminates.outerDecorative1mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.laminates.outerDecorative1mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Outer Shutter Area:</span>
                      <span className="font-bold text-slate-800">{materials.laminates.outerDecorative1mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>With Trimming (+10%):</span>
                      <span>{materials.laminates.outerDecorative1mm.grossSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheets:</span>
                      <span className="font-bold text-purple-700">{materials.laminates.outerDecorative1mm.sheets8x4} Sheets</span>
                    </div>
                  </div>
                </div>

                {/* 0.8mm Balancing Backer */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      0.8mm Balancing Backer
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold font-mono text-xs rounded">
                      {materials.laminates.shutterBalancing08mm.sheets8x4} Sheets (8'×4')
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {materials.laminates.shutterBalancing08mm.description}
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Inner Shutter Face:</span>
                      <span className="font-bold text-slate-800">{materials.laminates.shutterBalancing08mm.netSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>With Trimming (+10%):</span>
                      <span>{materials.laminates.shutterBalancing08mm.grossSqFt} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Standard 8'×4' Sheets:</span>
                      <span className="font-bold text-purple-700">{materials.laminates.shutterBalancing08mm.sheets8x4} Sheets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Edge Banding (Edge Binding) Meters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-emerald-500 rounded-xs" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    3. PVC Edge Banding (Edge Binding Tape)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  Total Running Meters: {materials.edgeBanding.totalRunningMeters} Meters
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 0.8mm Carcass Edge Band */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        0.8mm Carcass Edge Banding
                      </span>
                      <span className="text-[10px] text-slate-500">Sides, shelves, partitions & dividers</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs rounded">
                      {materials.edgeBanding.carcassEB08mm.grossMeters} Running Meters
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Exact Net Length:</span>
                      <span className="font-bold text-slate-800">{materials.edgeBanding.carcassEB08mm.netMeters} Meters</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">50-Meter Rolls:</span>
                      <span className="font-bold text-emerald-700">{materials.edgeBanding.carcassEB08mm.rolls50m} Rolls</span>
                    </div>
                  </div>
                </div>

                {/* 2.0mm Shutter Edge Band */}
                <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        2.0mm Heavy-Duty Shutter Edge Banding
                      </span>
                      <span className="text-[10px] text-slate-500">4 edges of hinged/sliding shutters & drawer fronts</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs rounded">
                      {materials.edgeBanding.shutterEB20mm.grossMeters} Running Meters
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Exact Net Length:</span>
                      <span className="font-bold text-slate-800">{materials.edgeBanding.shutterEB20mm.netMeters} Meters</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">50-Meter Rolls:</span>
                      <span className="font-bold text-emerald-700">{materials.edgeBanding.shutterEB20mm.rolls50m} Rolls</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Number of Pieces Per Room & Per Cabinet Unit Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-blue-600 rounded-xs" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    4. Furniture Units & Pieces Count in {activeRoom.name}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                  {materials.totalPieces} Pieces across {materials.totalFurnitureUnits} Cabinets
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border shadow-sm bg-white border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b font-semibold bg-slate-100 border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Cabinet / Unit Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Dimensions (WxHxD mm)</th>
                      <th className="p-3 text-center">Pieces Count</th>
                      <th className="p-3 text-right">Carcass Area</th>
                      <th className="p-3 text-right">Shutter Area</th>
                      <th className="p-3 text-right">Edge Banding</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {materials.furnitureBreakdown.map((item, idx) => {
                      const isExpanded = expandedUnitId === item.furnitureId;
                      return (
                        <React.Fragment key={item.furnitureId}>
                          <tr className="transition-colors hover:bg-slate-50">
                            <td className="p-3 text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{item.furnitureName}</td>
                            <td className="p-3 text-blue-600 uppercase font-semibold text-[11px]">{item.category}</td>
                            <td className="p-3 text-slate-600">{item.dimensions}</td>
                            <td className="p-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {item.pieceCount} Pieces
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">{item.carcassSqFt} SqFt</td>
                            <td className="p-3 text-right font-bold text-purple-700">{item.shutterSqFt} SqFt</td>
                            <td className="p-3 text-right font-bold text-emerald-700">{item.edgeBandingMeters} m</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setExpandedUnitId(isExpanded ? null : item.furnitureId)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Hide Parts' : 'View Parts'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={9} className="p-3">
                                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                                  <div className="text-[11px] font-bold text-slate-700 flex justify-between items-center">
                                    <span>Part Details for {item.furnitureName}</span>
                                    <span className="text-slate-500 font-normal">{item.items.length} unique parts</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                                    {item.items.map((part, pIdx) => (
                                      <div key={pIdx} className="p-2 rounded bg-slate-50 border border-slate-100 flex justify-between items-center">
                                        <div>
                                          <span className="font-semibold text-slate-900 block">{part.partName}</span>
                                          <span className="text-[10px] text-slate-500">{part.length} × {part.width} × {part.thickness} mm</span>
                                        </div>
                                        <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                                          Qty: {part.qty}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Fasteners, Adhesives & Consumables */}
            <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-4 bg-slate-700 rounded-xs" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  5. Adhesives, Connectors & Assembly Consumables
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block">Fevicol D3 Marine Glue</span>
                  <span className="font-bold text-slate-900 text-sm">{materials.hardwareAndConsumables.fevicolGlueKg} Kg</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">For laminate pressing</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block">Minifix & Dowel Sets</span>
                  <span className="font-bold text-slate-900 text-sm">{materials.hardwareAndConsumables.minifixSets} Sets</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Cam 15mm + 34mm bolt</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block">50mm Confirmat Screws</span>
                  <span className="font-bold text-slate-900 text-sm">{materials.hardwareAndConsumables.screws50mmNos} Nos</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Carcass assembly</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block">16mm Star Hardware Screws</span>
                  <span className="font-bold text-slate-900 text-sm">{materials.hardwareAndConsumables.screws16mmNos} Nos</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Hinges & slide brackets</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HARDWARE SCHEDULE */}
        {activeTab === 'hardware' && (
          <div className="space-y-4 max-w-4xl">
            <h3 className="text-sm font-bold text-slate-900">
              Complete Modular Fittings & Hardware Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border space-y-3 shadow-sm bg-white border-slate-200">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">
                    Soft-Close Concealed Hinges
                  </span>
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {materials.hardwareAndConsumables.hingesPairs} Pairs
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Auto 3D Clip-on with integrated soft damper (Hettich / Hafele 110° opening)
                </p>
              </div>

              <div className="p-5 rounded-xl border space-y-3 shadow-sm bg-white border-slate-200">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">
                    Tandem Box Drawer Runners
                  </span>
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {materials.hardwareAndConsumables.slidePairs} Pairs
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  500mm double-wall soft close tandem slides with 35kg dynamic load rating
                </p>
              </div>

              <div className="p-5 rounded-xl border space-y-3 shadow-sm bg-white border-slate-200">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">
                    Handles & Profile Rails
                  </span>
                  <span className="font-mono font-bold text-amber-600 text-sm">
                    {materials.hardwareAndConsumables.handlesNos} Nos
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  G-Profile / Edge Lip Concealed brushed anodized aluminum handles
                </p>
              </div>

              <div className="p-5 rounded-xl border space-y-3 shadow-sm bg-white border-slate-200">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">
                    Adjustable Skirting Legs
                  </span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {materials.hardwareAndConsumables.legsNos} Nos
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  100mm heavy duty PVC leveler legs with snap-on skirting clips
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUOTATION & BOM */}
        {activeTab === 'quotation' && (
          <div className="space-y-6 max-w-4xl">
            {/* Carpet Area vs Modular Surface Area Summary Header */}
            {(() => {
              const roomArea = calculateRoomArea(activeRoom);
              const projectArea = calculateProjectArea(project);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">
                          Current Room Carpet Area
                        </span>
                        <div className="text-base font-bold text-blue-950">
                          {activeRoom.name}: <span className="font-mono text-blue-700">{roomArea.formattedSqFt} sq.ft</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {roomArea.formattedDimensionsMm} ({roomArea.formattedSqM} m²)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                          Whole Project Total Area
                        </span>
                        <div className="text-base font-bold font-mono text-white">
                          {projectArea.formattedTotalSqFt} <span className="text-xs text-slate-300 font-normal">sq.ft total</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Across {projectArea.totalRooms} Rooms ({projectArea.formattedTotalSqM} m²)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cost Breakdown Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border shadow-sm bg-white border-slate-200">
                <span className="text-[11px] font-mono text-slate-500">
                  CARCASS PLYWOOD
                </span>
                <div className="text-base font-bold mt-1 text-slate-900">
                  ₹{quotation.carcassCost.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  {quotation.carcassAreaSqFt} Sq.Ft @ ₹160
                </span>
              </div>
              <div className="p-4 rounded-xl border shadow-sm bg-white border-slate-200">
                <span className="text-[11px] font-mono text-slate-500">
                  SHUTTERS (ACRYLIC)
                </span>
                <div className="text-base font-bold mt-1 text-slate-900">
                  ₹{quotation.shutterCost.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  {quotation.shutterAreaSqFt} Sq.Ft @ ₹310
                </span>
              </div>
              {quotation.frameRunningFt > 0 && (
                <div className="p-4 rounded-xl border shadow-sm bg-amber-50 border-amber-200">
                  <span className="text-[11px] font-mono text-amber-700">
                    SEMI-MODULAR FRAME
                  </span>
                  <div className="text-base font-bold mt-1 text-slate-900">
                    ₹{quotation.frameCost.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-amber-700">
                    {quotation.frameRunningFt} Running Ft @ ₹85
                  </span>
                </div>
              )}
              <div className="p-4 rounded-xl border shadow-sm bg-white border-slate-200">
                <span className="text-[11px] font-mono text-slate-500">
                  HARDWARE & RUNNERS
                </span>
                <div className="text-base font-bold mt-1 text-slate-900">
                  ₹{quotation.hardwareCost.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  Soft close hinges & slides
                </span>
              </div>
              <div className="p-4 rounded-xl border shadow-sm bg-blue-600 text-white border-blue-700">
                <span className="text-[11px] font-mono text-blue-100">
                  GRAND TOTAL ESTIMATE
                </span>
                <div className="text-xl font-bold text-white mt-1">₹{quotation.totalCost.toLocaleString()}</div>
                <span className="text-[10px] text-blue-100">
                  Incl. 18% Labor & Fitting
                </span>
              </div>
            </div>

            {/* Itemized Units Breakdown */}
            <div className="rounded-xl overflow-hidden border shadow-sm bg-white border-slate-200">
              <div className="p-3.5 border-b font-bold text-xs bg-slate-100 border-slate-200 text-slate-800">
                Itemized Unit Production Rates
              </div>
              <div className="divide-y text-xs divide-slate-100">
                {quotation.itemizedFurniture.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex justify-between items-center transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {item.dimensions} ({item.totalSqFt} Sq.Ft)
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600 font-mono text-sm">
                      ₹{item.estimatedCost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

