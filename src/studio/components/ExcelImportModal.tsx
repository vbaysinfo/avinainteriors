'use client';

import React, { useState, useRef } from 'react';
import { ProjectInfo, Room } from '../types/cad';
import {
  parseExcelWorkbookToProject,
  generateSampleExcelWorkbook,
  generateFlatSampleExcelWorkbook,
  generateSampleCsvString,
  ExcelParseResult,
} from '../utils/excelImportEngine';
import { downloadFile } from '../utils/cadExport';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Home,
  DoorOpen,
  LayoutGrid,
  Building2,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  PlusCircle,
  Copy,
  Table,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProject: (project: ProjectInfo) => void;
  currentProject: ProjectInfo;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onApplyProject,
  currentProject,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'sample_presets' | 'format_guide'>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Input or Drop
  const handleProcessFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseExcelWorkbookToProject(buffer);
        setParseResult(result);
      } catch (err: any) {
        setParseResult({
          success: false,
          errors: [`Error parsing Excel file: ${err?.message || 'Unknown error'}`],
          warnings: [],
          projectName: 'Failed Parse',
          projectType: '3BHK',
          parsedRooms: [],
          parsedFurniture: [],
          parsedOpenings: [],
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setParseResult({
        success: false,
        errors: ['Failed to read the file from disk.'],
        warnings: [],
        projectName: 'Error',
        projectType: '3BHK',
        parsedRooms: [],
        parsedFurniture: [],
        parsedOpenings: [],
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Download Multi-Sheet Sample .xlsx
  const handleDownloadMultiSheetTemplate = () => {
    const bytes = generateSampleExcelWorkbook();
    const blob = new Blob([bytes.slice()], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadFile('Multi_Room_CAD_Workbook.xlsx', blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  // Download Single-Sheet Flat Sample .xlsx
  const handleDownloadFlatTemplate = () => {
    const bytes = generateFlatSampleExcelWorkbook();
    const blob = new Blob([bytes.slice()], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadFile('Room_Measurements_Flat_Format.xlsx', blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  // Download CSV Sample Template
  const handleDownloadCsvTemplate = () => {
    const csvContent = generateSampleCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile('Room_Measurements_Sample.csv', blob, 'text/csv');
  };

  // Copy CSV to clipboard
  const handleCopyCsv = () => {
    const csvContent = generateSampleCsvString();
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  // Instant Load Sample Presets
  const handleLoadPresetSample = (presetType: '3bhk' | 'kitchen_wardrobe' | '2bhk' | '4bhk_villa') => {
    setIsProcessing(true);
    if (presetType === '4bhk_villa') {
      const flatBytes = generateFlatSampleExcelWorkbook();
      const result = parseExcelWorkbookToProject(flatBytes);
      result.projectName = '4BHK Luxury Villa Project';
      setParseResult(result);
      setUploadedFileName('Sample_4BHK_Villa_Template.xlsx');
    } else {
      const bytes = generateSampleExcelWorkbook();
      const result = parseExcelWorkbookToProject(bytes);
      if (presetType === 'kitchen_wardrobe' && result.generatedProject) {
        result.generatedProject.rooms = result.generatedProject.rooms.filter((r) =>
          r.type === 'Kitchen' || r.type === 'Master Bedroom'
        );
        result.projectName = 'Modular Kitchen & Master Wardrobe Project';
      } else if (presetType === '2bhk' && result.generatedProject) {
        result.generatedProject.rooms = result.generatedProject.rooms.slice(0, 3);
        result.projectName = '2BHK Executive Residence';
      }
      setParseResult(result);
      setUploadedFileName(`Sample_${presetType.toUpperCase()}_Template.xlsx`);
    }
    setIsProcessing(false);
  };

  // Apply to CAD Engine
  const handleApply = () => {
    if (!parseResult?.generatedProject) return;

    if (importMode === 'replace' || currentProject.rooms.length === 0) {
      onApplyProject(parseResult.generatedProject);
    } else {
      // Append mode: merge imported rooms with existing project rooms
      const mergedRooms = [...currentProject.rooms, ...parseResult.generatedProject.rooms];
      const updatedProject: ProjectInfo = {
        ...currentProject,
        rooms: mergedRooms,
        activeRoomId: parseResult.generatedProject.rooms[0]?.id || currentProject.activeRoomId,
        updatedAt: new Date().toISOString(),
      };
      onApplyProject(updatedProject);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center font-bold shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Excel Multi-Room Measurements Import
                </h2>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  .XLSX • .CSV • .XLS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Maps each row in your Excel file to a unique room instance with automated 2D floor plans, wall elevations & 3D models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Quick Downloads */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1. Upload & Generate</span>
            </button>
            <button
              onClick={() => setActiveTab('format_guide')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'format_guide'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Measurement Format Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('sample_presets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'sample_presets'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>3. Instant Sample Presets</span>
            </button>
          </div>

          {/* Quick Download Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMultiSheetTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download full 3-sheet Excel workbook (Rooms, Furniture, Openings)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Multi-Sheet (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadFlatTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download 1-sheet simple flat table format"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Single-Sheet Flat (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: UPLOAD & AUTO-DESIGN */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Drag & Drop your Excel sheet here, or <span className="text-blue-600 underline">Browse</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mb-3">
                  Upload an Excel workbook (<strong className="text-slate-700">.xlsx / .xls</strong>) or <strong className="text-slate-700">.csv</strong>. Each row is mapped to a unique room instance with dimensions in <strong className="text-slate-700">mm</strong>, <strong className="text-slate-700">feet-inches (e.g. 14ft × 12ft)</strong>, or <strong className="text-slate-700">meters</strong>.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 text-[11px] font-mono font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Supports multi-row room definitions, modular cabinetry & door/window schedules</span>
                </div>
              </div>

              {/* Parsing State / Results */}
              {isProcessing && (
                <div className="p-8 rounded-xl bg-slate-100 border border-slate-200 text-center animate-pulse">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <span className="text-sm font-bold text-slate-700">Parsing measurement matrices & drafting CAD layouts...</span>
                </div>
              )}

              {parseResult && !isProcessing && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  {parseResult.success ? (
                    <div className="p-4 rounded-xl border bg-emerald-50/80 border-emerald-200 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-emerald-950">
                            Excel Sheet Successfully Processed ({parseResult.parsedRooms.length} Unique Room Instances Mapped)
                          </h4>
                          {uploadedFileName && (
                            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded font-semibold">
                              {uploadedFileName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Mapped each row to a unique room instance: <strong className="font-bold">{parseResult.parsedRooms.length} Rooms</strong>,{' '}
                          <strong className="font-bold">{parseResult.parsedFurniture.length} Furniture/Modular Units</strong>, and{' '}
                          <strong className="font-bold">{parseResult.parsedOpenings.length} Doors/Windows</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border bg-rose-50 border-rose-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-950">Could Not Parse Excel File</h4>
                        <ul className="text-xs text-rose-800 list-disc list-inside mt-1">
                          {parseResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards */}
                  {parseResult.success && parseResult.generatedProject && (
                    <div className="space-y-4">
                      {/* Metric Stat Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Rooms</span>
                          <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-blue-600" />
                            <span>{parseResult.generatedProject.rooms.length} Rooms</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Carpet Area</span>
                          <div className="text-lg font-bold text-blue-600 mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span>
                              {Math.round(
                                parseResult.generatedProject.rooms.reduce(
                                  (sum, r) => sum + ((r.widthMm * r.depthMm) / 1000000) * 10.7639,
                                  0
                                ) * 10
                              ) / 10}{' '}
                              sq.ft
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Modular Units</span>
                          <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-purple-600" />
                            <span>
                              {parseResult.generatedProject.rooms.reduce((sum, r) => sum + r.furniture.length, 0)} Units
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Openings</span>
                          <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <DoorOpen className="w-4 h-4 text-emerald-600" />
                            <span>
                              {parseResult.generatedProject.rooms.reduce(
                                (sum, r) => sum + r.doors.length + r.windows.length,
                                0
                              )}{' '}
                              Openings
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rooms Table Preview (Row-by-Row Mapping) */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Table className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Excel Row to Room Instance Mapping ({parseResult.generatedProject.rooms.length} Rooms)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Auto-drafted with 4 structural walls, dimensions & furniture
                          </span>
                        </div>
                        <div className="divide-y divide-slate-200 bg-white max-h-64 overflow-y-auto">
                          {parseResult.generatedProject.rooms.map((r, idx) => {
                            const sqft = Math.round(((r.widthMm * r.depthMm) / 1000000) * 10.7639 * 10) / 10;
                            const sqm = Math.round(((r.widthMm * r.depthMm) / 1000000) * 100) / 100;
                            const ftW = Math.round(r.widthMm / 304.8);
                            const ftD = Math.round(r.depthMm / 304.8);

                            return (
                              <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs font-mono">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">{r.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                        {r.type}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                                      {r.widthMm} × {r.depthMm} mm ({ftW}ft × {ftD}ft) • Wall H: {r.heightMm}mm • Thk: {r.walls[0]?.thickness || 150}mm
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                  <div>
                                    <span className="font-bold font-mono text-blue-700 text-xs block">
                                      {sqft} sq.ft
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {sqm} m²
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[11px] font-semibold text-slate-700 block">
                                      {r.furniture.length} Units
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {r.doors.length}D • {r.windows.length}W
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Import Mode Selector: Replace vs Append */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-slate-800">Project Update Action:</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              value="replace"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-700 font-medium">
                              Replace Project Rooms ({parseResult.generatedProject.rooms.length} new rooms)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              value="append"
                              checked={importMode === 'append'}
                              onChange={() => setImportMode('append')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-700 font-medium">
                              Append / Add to Current ({currentProject.rooms.length} existing + {parseResult.generatedProject.rooms.length} new)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEASUREMENT FORMAT GUIDE & SAMPLE DOWNLOADS */}
          {activeTab === 'format_guide' && (
            <div className="space-y-6">
              {/* Instructions Banner */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs leading-relaxed flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-900 mb-1">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Multi-Room Excel Formatting Specification</span>
                  </div>
                  <p>
                    Every row in your Excel sheet corresponds to a distinct room instance. You can upload either a <strong>Single-Sheet Flat Table</strong> (simplest) or a <strong>Multi-Sheet Workbook</strong> (with dedicated sheets for Furniture & Openings).
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={handleDownloadFlatTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Flat Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleDownloadCsvTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Table 1: Single-Sheet Flat Format */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Format A: Single-Sheet Flat Table (Each Row = 1 Room)</span>
                  </div>
                  <button
                    onClick={handleCopyCsv}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCsv ? 'Copied CSV!' : 'Copy Sample Data'}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">Room Name</th>
                        <th className="p-2.5">Room Type</th>
                        <th className="p-2.5">Width</th>
                        <th className="p-2.5">Depth</th>
                        <th className="p-2.5">Height</th>
                        <th className="p-2.5">Wall Thk</th>
                        <th className="p-2.5">Furniture Item</th>
                        <th className="p-2.5">Door Width</th>
                        <th className="p-2.5">Window Width</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Master Bedroom</td>
                        <td className="p-2.5 text-blue-700 font-sans">Master Bedroom</td>
                        <td className="p-2.5 text-emerald-700">4267 mm (14ft)</td>
                        <td className="p-2.5 text-emerald-700">3658 mm (12ft)</td>
                        <td className="p-2.5">2900</td>
                        <td className="p-2.5">150</td>
                        <td className="p-2.5 text-purple-700 font-sans">4-Door Wardrobe with Loft</td>
                        <td className="p-2.5">900</td>
                        <td className="p-2.5">1500</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Modular Kitchen</td>
                        <td className="p-2.5 text-blue-700 font-sans">Kitchen</td>
                        <td className="p-2.5 text-emerald-700">3658 mm (12ft)</td>
                        <td className="p-2.5 text-emerald-700">3048 mm (10ft)</td>
                        <td className="p-2.5">2900</td>
                        <td className="p-2.5">150</td>
                        <td className="p-2.5 text-purple-700 font-sans">L-Shape Kitchen Base Counter</td>
                        <td className="p-2.5">900</td>
                        <td className="p-2.5">1200</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Living & Dining Area</td>
                        <td className="p-2.5 text-blue-700 font-sans">Living Room</td>
                        <td className="p-2.5 text-emerald-700">5500 mm (18ft)</td>
                        <td className="p-2.5 text-emerald-700">4200 mm (13ft 9in)</td>
                        <td className="p-2.5">2900</td>
                        <td className="p-2.5">150</td>
                        <td className="p-2.5 text-purple-700 font-sans">Floating TV Console with Louvers</td>
                        <td className="p-2.5">1050</td>
                        <td className="p-2.5">2400</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Kids Bedroom</td>
                        <td className="p-2.5 text-blue-700 font-sans">Bedroom 2</td>
                        <td className="p-2.5 text-emerald-700">3658 mm (12ft)</td>
                        <td className="p-2.5 text-emerald-700">3350 mm (11ft)</td>
                        <td className="p-2.5">2900</td>
                        <td className="p-2.5">150</td>
                        <td className="p-2.5 text-purple-700 font-sans">3-Door Wardrobe & Study Desk</td>
                        <td className="p-2.5">900</td>
                        <td className="p-2.5">1500</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Pooja Room</td>
                        <td className="p-2.5 text-blue-700 font-sans">Pooja</td>
                        <td className="p-2.5 text-emerald-700">1800 mm (6ft)</td>
                        <td className="p-2.5 text-emerald-700">1500 mm (5ft)</td>
                        <td className="p-2.5">2900</td>
                        <td className="p-2.5">150</td>
                        <td className="p-2.5 text-purple-700 font-sans">CNC Mandir Teak Unit</td>
                        <td className="p-2.5">750</td>
                        <td className="p-2.5">600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supported Dimensions & Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">📏 Millimeters (Standard)</span>
                  <p className="text-[11px] text-slate-600 font-mono">
                    3658, 3048, 1200mm, 2400mm
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">📐 Feet & Inches</span>
                  <p className="text-[11px] text-slate-600 font-mono">
                    12ft, 10'6", 14ft 2in, 18'
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">🧱 Wall Snapping Tags</span>
                  <p className="text-[11px] text-slate-600 font-mono">
                    left_wall, back_wall, right_wall, center
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INSTANT SAMPLE PRESETS */}
          {activeTab === 'sample_presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Want to test Excel Auto-Layout immediately? Click any sample preset below to load pre-calculated architectural measurements:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">3BHK Residence</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      5 Rooms: Living, Kitchen, Master Bed, Kids Bed & Pooja.
                    </p>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-fit mb-3">
                      5 Unique Rooms
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLoadPresetSample('3bhk');
                      setActiveTab('upload');
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Load 3BHK Template
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
                      <Home className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">4BHK Luxury Villa</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      8 Rooms: Living, Dining, Kitchen, Master, Bed 2, Bed 3, Pooja & Office.
                    </p>
                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block w-fit mb-3">
                      8 Unique Rooms
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLoadPresetSample('4bhk_villa');
                      setActiveTab('upload');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Load 4BHK Villa
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Kitchen & Wardrobe</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      L-Shape Quartz Kitchen + 4-Door Wardrobe with Loft.
                    </p>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block w-fit mb-3">
                      2 Rooms • Custom BOM
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLoadPresetSample('kitchen_wardrobe');
                      setActiveTab('upload');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Load Kitchen & Bed
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
                      <Home className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">2BHK Apartment</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      3 Rooms: Living Hall, Modular Kitchen & Master Suite.
                    </p>
                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block w-fit mb-3">
                      3 Unique Rooms
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLoadPresetSample('2bhk');
                      setActiveTab('upload');
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Load 2BHK Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMultiSheetTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Multi-Sheet (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadFlatTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Single-Sheet Flat (.xlsx)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!parseResult?.generatedProject || !parseResult.success}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>
                {importMode === 'replace'
                  ? `Apply & Generate ${parseResult?.generatedProject?.rooms.length || 0} Rooms`
                  : `Append ${parseResult?.generatedProject?.rooms.length || 0} Rooms to Project`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
