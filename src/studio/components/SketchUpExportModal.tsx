'use client';

import React, { useState } from 'react';
import { ProjectInfo, Room } from '../types/cad';
import {
  exportToSketchUpRuby,
  exportToSketchUpCollada,
  exportToSketchUpParametricMappingJSON,
  exportToSketchUpParametricCSV,
  exportToOBJ,
  exportToMTL,
  exportSketchUpPackageZIP,
  downloadFile,
} from '../utils/cadExport';
import { generateCuttingList, calculateQuotation } from '../utils/parametricEngine';
import {
  X,
  Box,
  Download,
  Code2,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Layers,
  Sparkles,
  Check,
  Copy,
  Info,
  ExternalLink,
  ChevronRight,
  Sliders,
  FolderArchive,
} from 'lucide-react';

interface SketchUpExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  activeRoom: Room;
}

export const SketchUpExportModal: React.FC<SketchUpExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'formats' | 'mapping' | 'guide'>('formats');
  const [copiedRuby, setCopiedRuby] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const cuttingList = generateCuttingList(activeRoom.furniture);
  const quotation = calculateQuotation(activeRoom.furniture);
  const baseFilename = `${project.name.replace(/\s+/g, '_')}_${activeRoom.name.replace(/\s+/g, '_')}`;

  // Download Handlers
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await exportSketchUpPackageZIP(project, activeRoom);
      downloadFile(`${baseFilename}_SketchUp_SKP_Package.zip`, zipBlob, 'application/zip');
    } catch (err) {
      console.error('Failed to generate SketchUp zip package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadRuby = () => {
    const rubyContent = exportToSketchUpRuby(project, activeRoom);
    downloadFile(`${baseFilename}_SketchUp_Dynamic_Components.rb`, rubyContent, 'text/x-ruby');
  };

  const handleDownloadCollada = () => {
    const daeContent = exportToSketchUpCollada(project, activeRoom);
    downloadFile(`${baseFilename}_SketchUp_Model.dae`, daeContent, 'application/xml');
  };

  const handleDownloadJSON = () => {
    const jsonContent = exportToSketchUpParametricMappingJSON(project, activeRoom);
    downloadFile(`${baseFilename}_Parametric_Data_Mapping.json`, jsonContent, 'application/json');
  };

  const handleDownloadCSV = () => {
    const csvContent = exportToSketchUpParametricCSV(project, activeRoom);
    downloadFile(`${baseFilename}_Parametric_Schedule.csv`, csvContent, 'text/csv');
  };

  const handleDownloadOBJ = () => {
    const objContent = exportToOBJ(project, activeRoom);
    downloadFile(`${baseFilename}_Model.obj`, objContent, 'text/plain');
  };

  const handleCopyRubyScript = () => {
    const rubyContent = exportToSketchUpRuby(project, activeRoom);
    navigator.clipboard.writeText(rubyContent);
    setCopiedRuby(true);
    setTimeout(() => setCopiedRuby(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden transition-colors bg-white border-slate-200 text-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold leading-tight">
                  SketchUp (.SKP) Parametric 3D Exporter
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase font-mono">
                  BIM & Dynamic Components
                </span>
              </div>
              <p className="text-xs mt-0.5 text-slate-500">
                {activeRoom.name} • {activeRoom.furniture.length} modular units • {cuttingList.length} cutting panels mapped
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border transition-colors bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b flex-shrink-0 bg-slate-50/50 border-slate-200">
          <button
            onClick={() => setActiveTab('formats')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'formats'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Export Formats & Packages</span>
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'mapping'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parametric Data Mapping ({activeRoom.furniture.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>SketchUp Import Instructions</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FORMATS & PACKAGES */}
          {activeTab === 'formats' && (
            <div className="space-y-5">
              {/* PRIMARY RECOMMENDED BUNDLE */}
              <div className="p-5 rounded-2xl border-2 border-red-500/40 relative overflow-hidden transition-all bg-gradient-to-br from-red-50/60 via-orange-50/30 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase font-mono tracking-wider">
                        Recommended Complete Bundle
                      </span>
                      <span className="text-xs font-bold text-red-600 font-mono">
                        .ZIP
                      </span>
                    </div>
                    <h3 className="text-base font-bold">
                      Complete SketchUp (.SKP) Compatibility Package
                    </h3>
                    <p className="text-xs max-w-xl text-slate-600">
                      Includes 1-Click SketchUp Ruby Dynamic Component generator (<code className="font-mono text-red-600">.rb</code>), native Collada 3D model (<code className="font-mono text-red-600">.dae</code>), Wavefront (<code className="font-mono text-red-600">.obj + .mtl</code>), structured parametric BIM JSON &amp; CSV schedules, and setup instructions.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isZipping ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Compiling ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-4 h-4" />
                        <span>Download Complete Package (.ZIP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* INDIVIDUAL FORMAT CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Ruby Dynamic Components Script (.rb) */}
                <div className="p-4 rounded-xl border flex flex-col justify-between transition-colors bg-slate-50/80 border-slate-200 hover:border-red-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs">SketchUp Ruby Script (.rb)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-bold">
                        Dynamic Components
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Directly executes in SketchUp's Ruby Console to generate native 3D component definitions with full <code className="font-mono text-red-600">dynamic_attributes</code> inspector mapping (carcass grade, shutters, hardware, cutting list, and INR quotation).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={handleDownloadRuby}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .rb</span>
                    </button>
                    <button
                      onClick={handleCopyRubyScript}
                      className="py-2 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      title="Copy Ruby Script to Clipboard"
                    >
                      {copiedRuby ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRuby ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. SketchUp Collada 3D (.dae) */}
                <div className="p-4 rounded-xl border flex flex-col justify-between transition-colors bg-slate-50/80 border-slate-200 hover:border-red-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          <Box className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs">SketchUp Collada 3D (.dae)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                        Direct Import
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Natively supported by Trimble SketchUp (File &gt; Import). Includes all 3D furniture meshes, materials, diffuse colors, and embedded <code className="font-mono text-blue-600">&lt;extra&gt;&lt;dynamic_attributes&gt;</code> metadata.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={handleDownloadCollada}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .dae</span>
                    </button>
                  </div>
                </div>

                {/* 3. Parametric BIM Mapping (.json & .csv) */}
                <div className="p-4 rounded-xl border flex flex-col justify-between transition-colors bg-slate-50/80 border-slate-200 hover:border-red-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs">Parametric Mapping Data (.json / .csv)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                        BIM Schedule
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Structured dictionary connecting every 3D model GUID to its parametric formulas, carcass/shutter thickness, edge banding specifications, and hardware schedules.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={handleDownloadJSON}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="py-2 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* 4. Wavefront 3D (.obj) */}
                <div className="p-4 rounded-xl border flex flex-col justify-between transition-colors bg-slate-50/80 border-slate-200 hover:border-red-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs">Wavefront 3D (.obj + .mtl)</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                        Universal Mesh
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Standard 3D polygon meshes with grouped component hierarchy and companion material color definitions for universal CAD/3D software.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={handleDownloadOBJ}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .obj</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETRIC DATA MAPPING MATRIX */}
          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border flex items-center justify-between text-xs bg-slate-50 border-slate-200 text-slate-700">
                <span>
                  The following <strong>{activeRoom.furniture.length} 3D modular units</strong> will have their parametric properties, cutting panels, and hardware mapped into SketchUp Dynamic Attributes:
                </span>
                <button
                  onClick={handleDownloadJSON}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Mapping JSON</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {activeRoom.furniture.map((item, idx) => {
                  const unitCutList = cuttingList.filter((c) => c.parentFurnitureId === item.id);
                  const unitQuote = quotation.itemizedFurniture.find((q) => q.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border transition-colors bg-white border-slate-200 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-red-600/10 text-red-600 font-bold text-xs flex items-center justify-center font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">{item.name}</span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                {item.category}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              GUID: {item.id.slice(0, 12)}...
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="font-bold text-red-600">
                            {item.width} × {item.depth} × {item.height} mm
                          </span>
                          <span className="text-slate-400">Z: {item.z}mm</span>
                        </div>
                      </div>

                      {/* Parametric Properties Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Carcass Spec</span>
                          <span className="font-semibold text-slate-700">
                            {item.parametric.carcassThickness}mm {item.materials.carcassMaterial}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Shutters</span>
                          <span className="font-semibold text-slate-700">
                            {item.parametric.shutterCount} nos • {item.parametric.shutterType} ({item.materials.shutterFinish})
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Hardware</span>
                          <span className="font-semibold text-slate-700">
                            {item.parametric.hingesCount || 0} hinges, {item.parametric.slidePairs || 0} slides, {item.parametric.handlesCount || 0} handles
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Mapped Panels & Cost</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            {unitCutList.length} parts • ₹{unitQuote ? unitQuote.estimatedCost.toLocaleString('en-IN') : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP SKETCHUP IMPORT GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl border space-y-3 bg-red-50/50 border-red-200 text-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide text-red-700">
                    Method 1: 1-Click SketchUp Ruby Dynamic Component Generator (Recommended)
                  </h4>
                </div>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-600">
                  <li>Open <strong>Trimble SketchUp</strong> (SketchUp Pro, Make, Studio, or Web).</li>
                  <li>Click top menu: <code className="px-1.5 py-0.5 rounded bg-black/10 font-mono">Window &gt; Ruby Console</code>.</li>
                  <li>
                    Click the <strong>Copy Ruby Script</strong> button below, paste it directly into the Ruby Console, and press <strong>Enter</strong>.
                  </li>
                  <li>
                    All 3D modular cabinets, wardrobes, shutters, countertop, and walls will be created instantly at exact millimeter coordinates!
                  </li>
                  <li>
                    Right-click any cabinet &gt; <code className="px-1.5 py-0.5 rounded bg-black/10 font-mono">Dynamic Components &gt; Component Options / Component Attributes</code> to view all mapped parametric variables, carcass plywood grade, hardware counts, and INR costing.
                  </li>
                </ol>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleCopyRubyScript}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    {copiedRuby ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedRuby ? 'Copied to Clipboard!' : 'Copy Ruby Console Script'}</span>
                  </button>
                  <button
                    onClick={handleDownloadRuby}
                    className="px-4 py-2 border rounded-lg font-semibold flex items-center gap-1.5 transition-colors bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .rb File</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-3 bg-slate-50 border-slate-200 text-slate-800">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide text-blue-700">
                    Method 2: Direct 3D Collada (.dae) Import
                  </h4>
                </div>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-600">
                  <li>Download the <code className="px-1.5 py-0.5 rounded bg-black/10 font-mono">.dae</code> file using the Collada download button.</li>
                  <li>In SketchUp, go to <code className="px-1.5 py-0.5 rounded bg-black/10 font-mono">File &gt; Import</code>.</li>
                  <li>Select <strong>COLLADA Files (*.dae)</strong> in the file format dropdown.</li>
                  <li>Select your exported file and click <strong>Import</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between flex-shrink-0 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>SketchUp Dynamic Component Standard 2026 Compatible</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-bold transition-colors bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
            >
              Close
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Generating Package...' : 'Download SketchUp Package (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
