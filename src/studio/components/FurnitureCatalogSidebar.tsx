'use client';

import React, { useState } from 'react';
import { CatalogFurnitureTemplate } from '../types/cad';
import { FURNITURE_CATALOG, FURNITURE_CATEGORIES } from '../data/furnitureCatalog';
import { Plus, Search, Layers, Box } from 'lucide-react';

interface FurnitureCatalogSidebarProps {
  onAddFurniture: (item: CatalogFurnitureTemplate) => void;
}

export const FurnitureCatalogSidebar: React.FC<FurnitureCatalogSidebarProps> = ({
  onAddFurniture,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = FURNITURE_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-68 h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden select-none z-20 flex-shrink-0 text-slate-800 transition-colors">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Modular Units Library
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {filteredItems.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search kitchen, wardrobe, bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="p-2 border-b border-slate-200 bg-slate-100/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {FURNITURE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md font-semibold uppercase text-[10px] whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Furniture Catalog Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.catalogId}
            className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/30 hover:border-blue-400 shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-xs block text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
                <span className="text-[11px] font-mono font-medium block mt-0.5 text-slate-500">
                  {item.defaultWidth} × {item.defaultHeight} × {item.defaultDepth} mm
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold flex-shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
                {item.category}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] font-mono text-slate-500">
                {item.defaultParametric?.shutterCount ? `${item.defaultParametric.shutterCount} Shutters` : ''}
                {item.defaultParametric?.drawerCount ? ` • ${item.defaultParametric.drawerCount} Drawers` : ''}
              </span>
              <button
                onClick={() => onAddFurniture(item)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 cursor-pointer"
                title={`Add ${item.name} to Active Room`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
