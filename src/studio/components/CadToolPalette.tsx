'use client';

import React from 'react';
import { CadTool } from '../types/cad';
import {
  MousePointer,
  Hand,
  Square,
  DoorOpen,
  AppWindow,
  Ruler,
  Type,
  BoxSelect,
  FlipHorizontal,
  FlipVertical,
  Sparkles,
} from 'lucide-react';

interface CadToolPaletteProps {
  activeTool: CadTool;
  onSelectTool: (tool: CadTool) => void;
  onMirror?: (direction: 'horizontal' | 'vertical') => void;
}

export const CadToolPalette: React.FC<CadToolPaletteProps> = ({
  activeTool,
  onSelectTool,
  onMirror,
}) => {
  const tools: Array<{ id: CadTool; label: string; icon: React.ReactNode; shortcut: string; isAction?: boolean; actionDir?: 'horizontal' | 'vertical' }> = [
    { id: 'SELECT', label: 'Select / Move (V)', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'PAN', label: 'Pan Canvas (H)', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'WALL', label: 'Draw Wall (W) [Right Click to Disconnect]', icon: <Square className="w-4 h-4" />, shortcut: 'W' },
    { id: 'DOOR', label: 'Insert Door (D)', icon: <DoorOpen className="w-4 h-4" />, shortcut: 'D' },
    { id: 'WINDOW', label: 'Insert Window (N)', icon: <AppWindow className="w-4 h-4" />, shortcut: 'N' },
    { id: 'COLUMN', label: 'RCC Column (C)', icon: <BoxSelect className="w-4 h-4" />, shortcut: 'C' },
    { id: 'AUTO_DIMENSION', label: 'Auto-Dimension (A) [Detect All Wall & Furniture Distances]', icon: <Sparkles className="w-4 h-4" />, shortcut: 'A' },
    { id: 'MEASURE', label: 'Measure Ruler (M) [Right Click to Disconnect]', icon: <Ruler className="w-4 h-4" />, shortcut: 'M' },
    { id: 'MIRROR_H', label: 'Mirror Horizontally (Flip H)', icon: <FlipHorizontal className="w-4 h-4" />, shortcut: 'Shift+H', isAction: true, actionDir: 'horizontal' },
    { id: 'MIRROR_V', label: 'Mirror Vertically (Flip V)', icon: <FlipVertical className="w-4 h-4" />, shortcut: 'Shift+V', isAction: true, actionDir: 'vertical' },
    { id: 'TEXT', label: 'Text Note (T)', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
  ];

  const handleClick = (t: typeof tools[0]) => {
    if (t.isAction && t.actionDir && onMirror) {
      onMirror(t.actionDir);
    }
    onSelectTool(t.id);
  };

  return (
    <aside className="w-13 flex flex-col items-center py-3 gap-2 select-none z-20 flex-shrink-0 border-r bg-slate-50/80 border-slate-200 text-slate-700 transition-colors">
      {tools.map((t, idx) => {
        const isActive = activeTool === t.id;
        return (
          <React.Fragment key={t.id}>
            {idx === 2 || idx === 6 || idx === 8 ? (
              <div className="h-[1px] w-7 my-1 bg-slate-200" />
            ) : null}
            <button
              onClick={() => handleClick(t)}
              title={`${t.label}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm'
              }`}
            >
              {t.icon}
            </button>
          </React.Fragment>
        );
      })}
    </aside>
  );
};
