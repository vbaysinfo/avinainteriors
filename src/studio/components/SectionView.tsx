'use client';

import React from 'react';
import { ProjectInfo, Room } from '../types/cad';

interface SectionViewProps {
  project: ProjectInfo;
  activeRoom: Room;
}

export const SectionView: React.FC<SectionViewProps> = ({ project, activeRoom }) => {
  const isKitchen = activeRoom.type === 'Kitchen';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none bg-slate-100 text-slate-800">
      {/* Section Header */}
      <div className="h-11 border-b px-4 flex items-center justify-between z-10 bg-white border-slate-200 text-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
            {isKitchen ? 'Kitchen Cross-Section A-A (Modular Carcass & Clearances)' : 'Wardrobe Cross-Section A-A (Internal Depth & Shelf Slices)'}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Room Clear Height: {activeRoom.heightMm} mm
          </span>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-500">
          Manufacturing Scale 1:15
        </div>
      </div>

      {/* Main Section Drawing Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div className="relative rounded-xl shadow-xl p-10 max-w-4xl w-full flex items-center justify-center gap-16 border bg-white border-slate-200">
          {/* Detailed CAD Section Diagram */}
          <div className="relative w-80 h-[560px] rounded-lg p-6 flex flex-col justify-between border shadow-inner bg-slate-50 border-slate-300">
            {/* Back Wall Line (RCC Concrete wall) */}
            <div className="absolute left-6 top-6 bottom-6 w-3 border-r bg-slate-300 border-slate-400">
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                150mm RCC Wall
              </div>
            </div>

            {isKitchen ? (
              <>
                {/* 1. Overhead Loft Unit (Top) */}
                <div className="ml-5 h-16 w-36 rounded border-2 relative p-1.5 flex flex-col justify-between bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs">
                  <span className="text-[9px] font-bold font-mono">LOFT UNIT</span>
                  <div className="text-[8px] font-mono text-indigo-700">
                    D: 350mm | H: 500mm
                  </div>
                </div>

                {/* 2. Wall Overhead Cabinet */}
                <div className="ml-5 h-28 w-32 rounded border-2 relative p-2 flex flex-col justify-between shadow-sm bg-sky-50 border-sky-500 text-sky-900">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold font-mono">WALL CABINET</span>
                    <span className="text-[8px] px-1 py-0.5 rounded border font-semibold bg-sky-200 text-sky-900 border-sky-300">
                      D: 320
                    </span>
                  </div>
                  {/* Internal Shelf Line */}
                  <div className="w-full border-t border-dashed border-sky-400/60 my-1" />
                  <div className="text-[8px] font-mono text-sky-700">
                    H: 600mm | 18mm BWP Ply
                  </div>
                </div>

                {/* 3. Dado / Splash Clearance Gap (600mm) */}
                <div className="ml-5 h-24 w-40 border-l-2 border-dashed border-amber-500 flex items-center justify-center bg-amber-500/10">
                  <span className="text-[9px] font-bold text-amber-800 font-mono bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    ↑ 600 mm DADO CLEARANCE
                  </span>
                </div>

                {/* 4. Countertop Slab (Quartz 20mm, Depth 600mm) */}
                <div className="ml-5 h-4 w-48 bg-stone-200 border border-stone-400 rounded-sm relative shadow-sm flex items-center justify-between px-2">
                  <span className="text-[8px] font-bold text-stone-900 font-mono">QUARTZ COUNTERTOP 20mm</span>
                  <span className="text-[8px] text-stone-700 font-mono">D: 600mm</span>
                </div>

                {/* 5. Base Cabinet (Depth 560mm, Height 720mm) */}
                <div className="ml-5 h-36 w-44 rounded border-2 relative p-2 flex flex-col justify-between shadow-sm bg-emerald-50 border-emerald-500 text-emerald-900">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold font-mono">BASE CABINET</span>
                    <span className="text-[8px] px-1 py-0.5 rounded border font-semibold bg-emerald-200 text-emerald-900 border-emerald-300">
                      D: 560
                    </span>
                  </div>
                  {/* Internal Tandem Drawer Slide representations */}
                  <div className="space-y-1 my-1">
                    <div className="w-full border-t border-emerald-500/40" />
                    <div className="w-full border-t border-emerald-500/40" />
                  </div>
                  <div className="text-[8px] font-mono text-emerald-700">
                    H: 720mm | Tandem Runners
                  </div>
                </div>

                {/* 6. Skirting & PVC Adjustable Legs (75mm - 100mm) */}
                <div className="ml-5 h-6 w-44 flex items-center justify-between px-4 rounded border bg-slate-200 border-slate-300 text-slate-700">
                  <div className="w-3 h-4 bg-slate-400 rounded-sm" />
                  <span className="text-[8px] font-mono font-semibold">SKIRTING: 75 mm</span>
                  <div className="w-3 h-4 bg-slate-400 rounded-sm" />
                </div>
              </>
            ) : (
              /* Wardrobe Cross-Section */
              <>
                {/* Overhead Loft */}
                <div className="ml-5 h-20 w-44 rounded border-2 p-2 flex flex-col justify-between bg-indigo-50 border-indigo-400 text-indigo-900">
                  <span className="text-[10px] font-bold font-mono">WARDROBE LOFT</span>
                  <span className="text-[8px] font-mono text-indigo-700">
                    D: 600mm | H: 600mm
                  </span>
                </div>

                {/* Wardrobe Internal Carcass Slice */}
                <div className="ml-5 flex-1 w-44 rounded border-2 my-2 p-2 flex flex-col justify-between bg-sky-50 border-sky-400 text-sky-900">
                  <div>
                    <span className="text-[10px] font-bold font-mono">MAIN CARCASS (D: 600)</span>
                    <div className="w-full border-t border-dashed border-sky-400 my-2" />
                    <span className="text-[8px] font-mono text-sky-800">
                      Top Hanging Rod (SS Oval)
                    </span>
                  </div>
                  <div>
                    <div className="w-full border-t border-dashed border-sky-400 my-1" />
                    <span className="text-[8px] font-mono text-sky-800">
                      Internal Lockers & Drawers
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-sky-700">
                    H: 2100mm | 18mm BWP Plywood
                  </div>
                </div>

                {/* Skirting */}
                <div className="ml-5 h-6 w-44 flex items-center justify-between px-4 rounded border bg-slate-200 border-slate-300 text-slate-700">
                  <span className="text-[8px] font-mono font-semibold">SKIRTING: 75 mm</span>
                </div>
              </>
            )}

            {/* Floor Slab Base */}
            <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-amber-600" />
          </div>

          {/* Section Dimension Specifications Table */}
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-slate-900 border-slate-200">
              <span className="w-2.5 h-2.5 rounded bg-blue-600" />
              Standard Modular Ergonomics & Assembly Specs
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Total Floor to Ceiling:
                </span>
                <span className="font-bold text-slate-900">
                  2900 mm
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Base Unit Height (Carcass + Counter):
                </span>
                <span className="text-emerald-600 font-bold">860 mm (720 + 20 + 75)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Dado Splash Clearance:
                </span>
                <span className="text-amber-600 font-bold">600 mm</span>
              </div>
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Wall Overhead Cabinet Depth:
                </span>
                <span className="text-sky-600 font-bold">320 mm</span>
              </div>
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Base Cabinet Carcass Depth:
                </span>
                <span className="text-sky-600 font-bold">560 mm</span>
              </div>
              <div className="flex justify-between p-2.5 rounded border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">
                  Quartz Countertop Overhang:
                </span>
                <span className="font-bold text-slate-700">
                  25 mm front drip edge
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border text-xs leading-relaxed bg-blue-50/70 border-blue-200 text-slate-700">
              💡 <span className="font-bold text-blue-900">Factory Assembly Rule:</span> All horizontal shelves and top/bottom panels are rebated into side panels with 18mm thickness deduction (<span className="text-blue-700 font-mono font-bold">W - 36mm</span>). Back ply is grooved 8mm deep into sides.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
