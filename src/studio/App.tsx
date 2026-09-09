'use client';

import React, { useState } from 'react';
import { ProjectInfo, Room, CadViewMode, CadTool, FurnitureItem } from './types/cad';
import { SAMPLE_PROJECTS } from './data/defaultProject';
import { HeaderNav } from './components/HeaderNav';
import { RoomTabsBar } from './components/RoomTabsBar';
import { CadToolPalette } from './components/CadToolPalette';
import { CadCanvas2D } from './components/CadCanvas2D';
import { ElevationView } from './components/ElevationView';
import { SectionView } from './components/SectionView';
import { ThreeDStudio } from './components/ThreeDStudio';
import { CuttingListPanel } from './components/CuttingListPanel';
import { FurnitureCatalogSidebar } from './components/FurnitureCatalogSidebar';
import { PropertyInspector } from './components/PropertyInspector';
import { SketchUploadModal } from './components/SketchUploadModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ProjectModal } from './components/ProjectModal';
import { SketchUpExportModal } from './components/SketchUpExportModal';
import { ClearCanvasModal } from './components/ClearCanvasModal';
import { mirrorFurnitureItem } from './utils/parametricEngine';

export default function App() {
  const [project, setProject] = useState<ProjectInfo>(SAMPLE_PROJECTS[0]);
  const [viewMode, setViewMode] = useState<CadViewMode>('2D_PLAN');
  const [activeTool, setActiveTool] = useState<CadTool>('SELECT');

  const [isSketchUploadModalOpen, setIsSketchUploadModalOpen] = useState<boolean>(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isSketchUpExportModalOpen, setIsSketchUpExportModalOpen] = useState<boolean>(false);
  const [isClearCanvasModalOpen, setIsClearCanvasModalOpen] = useState<boolean>(false);

  // Active Room
  const activeRoom = project.rooms.find((r) => r.id === project.activeRoomId) || project.rooms[0];

  // Update room state
  const handleUpdateRoom = (updatedRoom: Room) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
    }));
  };

  // Delete Room
  const handleDeleteRoom = (roomId: string) => {
    if (project.rooms.length <= 1) return;
    const remainingRooms = project.rooms.filter((r) => r.id !== roomId);
    setProject((prev) => ({
      ...prev,
      rooms: remainingRooms,
      activeRoomId: remainingRooms[0].id,
      selectedFurnitureId: null,
    }));
  };

  // Select Furniture
  const handleSelectFurniture = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedFurnitureId: id,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedColumnId: null,
      selectedTextId: null,
    }));
  };

  // Select Door
  const handleSelectDoor = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedDoorId: id,
      selectedFurnitureId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedColumnId: null,
      selectedTextId: null,
    }));
  };

  // Select Window
  const handleSelectWindow = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedWindowId: id,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWallId: null,
      selectedColumnId: null,
      selectedTextId: null,
    }));
  };

  // Select Column
  const handleSelectColumn = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedColumnId: id,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedTextId: null,
    }));
  };

  // Select Wall
  const handleSelectWall = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedWallId: id,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedColumnId: null,
      selectedTextId: null,
    }));
  };

  // Select Text Annotation
  const handleSelectText = (id: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedTextId: id,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedColumnId: null,
    }));
  };

  // Clear Selection
  const handleClearSelection = () => {
    setProject((prev) => ({
      ...prev,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedColumnId: null,
      selectedTextId: null,
    }));
  };

  // Mirror Selected Furniture from Tool Palette
  const handleMirrorSelected = (direction: 'horizontal' | 'vertical') => {
    if (!project.selectedFurnitureId) return;
    const selectedItem = activeRoom.furniture.find((f) => f.id === project.selectedFurnitureId);
    if (!selectedItem) return;
    const mirrored = mirrorFurnitureItem(selectedItem, direction);
    const updatedFurnitureList = activeRoom.furniture.map((f) =>
      f.id === selectedItem.id ? mirrored : f
    );
    handleUpdateRoom({
      ...activeRoom,
      furniture: updatedFurnitureList,
    });
  };

  // Update single furniture item
  const handleUpdateFurniture = (updatedItem: FurnitureItem) => {
    const updatedFurnitureList = activeRoom.furniture.map((f) =>
      f.id === updatedItem.id ? updatedItem : f
    );
    handleUpdateRoom({
      ...activeRoom,
      furniture: updatedFurnitureList,
    });
  };

  // Delete furniture item
  const handleDeleteFurniture = (id: string) => {
    const updatedFurnitureList = activeRoom.furniture.filter((f) => f.id !== id);
    handleUpdateRoom({
      ...activeRoom,
      furniture: updatedFurnitureList,
    });
    handleSelectFurniture(null);
  };

  // Add furniture item from catalog
  const handleAddFurnitureFromCatalog = (catalogItem: any) => {
    // Smart Placement along wall or next to existing items
    const lastItem = activeRoom.furniture[activeRoom.furniture.length - 1];
    let newX = 200;
    let newY = 50;

    if (lastItem) {
      if (lastItem.x + lastItem.width + catalogItem.defaultWidth < activeRoom.widthMm - 200) {
        newX = lastItem.x + lastItem.width;
        newY = lastItem.y;
      } else {
        newX = 200;
        newY = Math.min(activeRoom.depthMm - catalogItem.defaultDepth - 100, lastItem.y + lastItem.depth + 100);
      }
    }

    // Quartz Countertop is strictly restricted to Kitchen Base units
    const isKitchenBase =
      catalogItem.category === 'kitchen' &&
      !catalogItem.catalogId.includes('wall') &&
      !catalogItem.catalogId.includes('overhead') &&
      !catalogItem.catalogId.includes('tall') &&
      !catalogItem.catalogId.includes('fridge') &&
      !catalogItem.catalogId.includes('oven') &&
      !catalogItem.catalogId.includes('below_overhead') &&
      catalogItem.defaultParametric?.hasCountertop === true;

    const newItem: FurnitureItem = {
      id: `f_${Date.now()}`,
      catalogId: catalogItem.catalogId,
      category: catalogItem.category,
      name: `${catalogItem.name}`,
      x: newX,
      y: newY,
      z:
        catalogItem.category === 'kitchen' &&
        (catalogItem.catalogId.includes('wall') || catalogItem.catalogId.includes('overhead'))
          ? 1400
          : catalogItem.defaultZ || 0,
      width: catalogItem.defaultWidth,
      height: catalogItem.defaultHeight,
      depth: catalogItem.defaultDepth,
      rotation: 0,
      parametric: {
        carcassThickness: 18,
        backPlyThickness: catalogItem.catalogId.includes('sink') ? 0 : 9,
        shutterCount: catalogItem.defaultParametric?.shutterCount || 0,
        shutterType: catalogItem.defaultParametric?.shutterType || 'hinged',
        shutterFinish: 'Acrylic High Gloss',
        shutterColor: '#FAFAFA',
        handleType: 'g_profile',
        drawerCount: catalogItem.defaultParametric?.drawerCount || 0,
        shelfCount: catalogItem.defaultParametric?.shelfCount || 1,
        hasLoft: false,
        loftHeight: 0,
        hasCountertop: isKitchenBase,
        countertopThickness: isKitchenBase ? 20 : 0,
        countertopOverhang: isKitchenBase ? 25 : 0,
        countertopMaterial: isKitchenBase ? 'Quartz Calacatta Gold' : '',
        skirtingHeight: 75,
        hingesCount: (catalogItem.defaultParametric?.shutterCount || 0) * 3,
        slidePairs: catalogItem.defaultParametric?.drawerCount || 0,
        handlesCount: (catalogItem.defaultParametric?.shutterCount || 0) + (catalogItem.defaultParametric?.drawerCount || 0),
        legsCount: 4,
      },
      materials: {
        carcassMaterial: '18mm BWP Plywood',
        carcassFinish: 'Frosty White',
        shutterMaterial: 'Acrylic High Gloss',
        shutterFinish: 'Ultra White',
        shutterColor: '#FAFAFA',
        counterMaterial: isKitchenBase ? 'Quartz Calacatta Gold' : '',
      },
    };

    handleUpdateRoom({
      ...activeRoom,
      furniture: [...activeRoom.furniture, newItem],
    });
    handleSelectFurniture(newItem.id);
  };

  // Add Room
  const handleAddRoom = () => {
    const roomCount = project.rooms.length + 1;
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      name: `Room ${roomCount} (Custom)`,
      type: 'Custom',
      widthMm: 4000,
      depthMm: 3500,
      heightMm: 2900,
      walls: [
        { id: `w1_${Date.now()}`, x1: 0, y1: 0, x2: 4000, y2: 0, thickness: 150, height: 2900 },
        { id: `w2_${Date.now()}`, x1: 4000, y1: 0, x2: 4000, y2: 3500, thickness: 150, height: 2900 },
        { id: `w3_${Date.now()}`, x1: 4000, y1: 3500, x2: 0, y2: 3500, thickness: 150, height: 2900 },
        { id: `w4_${Date.now()}`, x1: 0, y1: 3500, x2: 0, y2: 0, thickness: 150, height: 2900 },
      ],
      doors: [
        { id: `d1_${Date.now()}`, x: 2800, y: 3500, width: 900, height: 2100, wallSide: 'bottom', rotation: 0, swing: 'inward_right' },
      ],
      windows: [
        { id: `win1_${Date.now()}`, x: 1200, y: 0, width: 1400, height: 1200, sillHeight: 900, wallSide: 'top', rotation: 0, type: 'sliding' },
      ],
      columns: [],
      furniture: [],
      dimensions: [
        { id: `dim1_${Date.now()}`, x1: 0, y1: -80, x2: 4000, y2: -80, offset: 80, textOverride: '4000 mm', type: 'linear' },
        { id: `dim2_${Date.now()}`, x1: -80, y1: 0, x2: -80, y2: 3500, offset: 80, textOverride: '3500 mm', type: 'linear' },
      ],
      textAnnotations: [
        { id: `txt_${Date.now()}`, x: 2000, y: 1750, text: `ROOM ${roomCount}`, fontSize: 160 },
      ],
      sectionCuts: [
        { id: `sec_${Date.now()}`, label: 'Section A-A', x1: 100, y1: 200, x2: 3900, y2: 200, viewDirection: 'up' },
      ],
    };

    setProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
      activeRoomId: newRoom.id,
      selectedFurnitureId: null,
    }));
  };

  // Switch Active Room
  const handleSelectRoom = (roomId: string) => {
    setProject((prev) => ({
      ...prev,
      activeRoomId: roomId,
      selectedFurnitureId: null,
    }));
  };

  // AI Sketch to CAD Applied
  const handleApplyAiSketchRoom = (generatedRoom: Room) => {
    setProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, generatedRoom],
      activeRoomId: generatedRoom.id,
      selectedFurnitureId: null,
    }));
  };

  // Clear Furniture in Active Room
  const handleClearFurnitureOnly = () => {
    handleUpdateRoom({
      ...activeRoom,
      furniture: [],
    });
    handleSelectFurniture(null);
  };

  // Clear Entire Room 2D Canvas Layout Data (Leave clean perimeter walls)
  const handleClearEntireRoomCanvas = () => {
    handleUpdateRoom({
      ...activeRoom,
      furniture: [],
      doors: [],
      windows: [],
      columns: [],
      textAnnotations: [
        {
          id: `txt_${Date.now()}`,
          x: Math.round(activeRoom.widthMm / 2),
          y: Math.round(activeRoom.depthMm / 2),
          text: activeRoom.name.toUpperCase(),
          fontSize: 160,
        },
      ],
      dimensions: [
        {
          id: `dim1_${Date.now()}`,
          x1: 0,
          y1: -80,
          x2: activeRoom.widthMm,
          y2: -80,
          offset: 80,
          textOverride: `${activeRoom.widthMm} mm`,
          type: 'linear',
        },
        {
          id: `dim2_${Date.now()}`,
          x1: -80,
          y1: 0,
          x2: -80,
          y2: activeRoom.depthMm,
          offset: 80,
          textOverride: `${activeRoom.depthMm} mm`,
          type: 'linear',
        },
      ],
    });
    handleClearSelection();
  };

  // Clear Entire Project and Start a New Blank Project
  const handleStartFreshProject = () => {
    const blankRoomId = `room_${Date.now()}`;
    const defaultW = 4500;
    const defaultD = 3600;
    const blankRoom: Room = {
      id: blankRoomId,
      name: 'Living Room',
      type: 'Living Room',
      widthMm: defaultW,
      depthMm: defaultD,
      heightMm: 2900,
      walls: [
        { id: `w1_${Date.now()}`, x1: 0, y1: 0, x2: defaultW, y2: 0, thickness: 150, height: 2900 },
        { id: `w2_${Date.now()}`, x1: defaultW, y1: 0, x2: defaultW, y2: defaultD, thickness: 150, height: 2900 },
        { id: `w3_${Date.now()}`, x1: defaultW, y1: defaultD, x2: 0, y2: defaultD, thickness: 150, height: 2900 },
        { id: `w4_${Date.now()}`, x1: 0, y1: defaultD, x2: 0, y2: 0, thickness: 150, height: 2900 },
      ],
      doors: [
        { id: `d1_${Date.now()}`, x: defaultW - 1200, y: defaultD, width: 900, height: 2100, wallSide: 'bottom', rotation: 0, swing: 'inward_right' },
      ],
      windows: [
        { id: `win1_${Date.now()}`, x: 1200, y: 0, width: 1400, height: 1200, sillHeight: 900, wallSide: 'top', rotation: 0, type: 'sliding' },
      ],
      columns: [],
      furniture: [],
      dimensions: [
        { id: `dim1_${Date.now()}`, x1: 0, y1: -80, x2: defaultW, y2: -80, offset: 80, textOverride: `${defaultW} mm`, type: 'linear' },
        { id: `dim2_${Date.now()}`, x1: -80, y1: 0, x2: -80, y2: defaultD, offset: 80, textOverride: `${defaultD} mm`, type: 'linear' },
      ],
      textAnnotations: [
        { id: `txt_${Date.now()}`, x: Math.round(defaultW / 2), y: Math.round(defaultD / 2), text: 'LIVING ROOM', fontSize: 160 },
      ],
      sectionCuts: [
        { id: `sec_${Date.now()}`, label: 'Section A-A', x1: 100, y1: 200, x2: defaultW - 100, y2: 200, viewDirection: 'up' },
      ],
    };

    const freshProject: ProjectInfo = {
      id: `proj_${Date.now()}`,
      name: 'New Interior Project',
      customerName: 'Client',
      siteAddress: 'Site Address',
      projectType: 'Custom',
      unitSystem: 'mm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rooms: [blankRoom],
      activeRoomId: blankRoomId,
      selectedFurnitureId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedColumnId: null,
      selectedTextId: null,
    };

    setProject(freshProject);
    setViewMode('2D_PLAN');
    setActiveTool('SELECT');
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden font-sans select-none bg-slate-100 text-slate-800">
      {/* Top Header Navigation */}
      <HeaderNav
        project={project}
        activeRoom={activeRoom}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectRoom={handleSelectRoom}
        onOpenNewProjectModal={() => setIsProjectModalOpen(true)}
        onOpenSketchUploadModal={() => setIsSketchUploadModalOpen(true)}
        onOpenExcelImportModal={() => setIsExcelImportModalOpen(true)}
        onOpenSketchUpModal={() => setIsSketchUpExportModalOpen(true)}
        onOpenClearModal={() => setIsClearCanvasModalOpen(true)}
        onAddRoom={handleAddRoom}
      />

      {/* Room Tabs Bar (Prominent Room Selection & Breadcrumb) */}
      <RoomTabsBar
        project={project}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        onAddRoom={handleAddRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Modular Furniture Library Sidebar (Shown in 2D & 3D view) */}
        {(viewMode === '2D_PLAN' || viewMode === '3D_VIEW') && (
          <FurnitureCatalogSidebar
            onAddFurniture={handleAddFurnitureFromCatalog}
          />
        )}

        {/* CAD Tool Palette (Shown in 2D Plan View) */}
        {viewMode === '2D_PLAN' && (
          <CadToolPalette
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onMirror={handleMirrorSelected}
          />
        )}

        {/* Central Viewport Content */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-100">
          {viewMode === '2D_PLAN' && (
            <CadCanvas2D
              project={project}
              activeRoom={activeRoom}
              activeTool={activeTool}
              onSelectFurniture={handleSelectFurniture}
              onSelectDoor={handleSelectDoor}
              onSelectWindow={handleSelectWindow}
              onSelectColumn={handleSelectColumn}
              onSelectWall={handleSelectWall}
              onSelectText={handleSelectText}
              onClearSelection={handleClearSelection}
              onUpdateRoom={handleUpdateRoom}
              onUpdateFurniture={handleUpdateFurniture}
              onDeleteFurniture={handleDeleteFurniture}
              onToolChange={setActiveTool}
              onOpenClearModal={() => setIsClearCanvasModalOpen(true)}
            />
          )}

          {viewMode === 'ELEVATION' && (
            <ElevationView
              project={project}
              activeRoom={activeRoom}
              onSelectFurniture={handleSelectFurniture}
              onUpdateRoom={handleUpdateRoom}
            />
          )}

          {viewMode === 'SECTION' && (
            <SectionView
              project={project}
              activeRoom={activeRoom}
            />
          )}

          {viewMode === '3D_VIEW' && (
            <ThreeDStudio
              project={project}
              activeRoom={activeRoom}
              onSelectFurniture={handleSelectFurniture}
            />
          )}

          {viewMode === 'CUTTING_LIST' && (
            <CuttingListPanel
              project={project}
              activeRoom={activeRoom}
            />
          )}
        </main>

        {/* Right Property Inspector Panel (Shown in 2D, Elevation & 3D view) */}
        {(viewMode === '2D_PLAN' || viewMode === 'ELEVATION' || viewMode === '3D_VIEW') && (
          <PropertyInspector
            project={project}
            activeRoom={activeRoom}
            onUpdateFurniture={handleUpdateFurniture}
            onUpdateRoom={handleUpdateRoom}
            onDeleteFurniture={handleDeleteFurniture}
            onSelectFurniture={handleSelectFurniture}
            onSelectDoor={handleSelectDoor}
            onSelectWindow={handleSelectWindow}
            onSelectColumn={handleSelectColumn}
            onSelectWall={handleSelectWall}
            onSelectText={handleSelectText}
            onSelectRoom={handleSelectRoom}
            onClearSelection={handleClearSelection}
          />
        )}
      </div>

      {/* Engineering Footer Status Bar */}
      <footer className="h-7 sm:h-8 flex items-center justify-between px-3 text-[10px] font-mono flex-shrink-0 select-none z-30 bg-slate-900 text-slate-200 border-t border-slate-700">
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            READY
          </span>
          <span className="text-slate-400">SNAP: 50mm ON</span>
          <span className="text-slate-400 hidden sm:inline">ORTHO: POLAR TRACKING</span>
          <span className="text-slate-400 hidden md:inline">PARAMETRIC ENGINE: LIVE</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-slate-300 font-semibold">
            {activeRoom.name}: <span className="text-blue-400 font-bold">{Math.round(((activeRoom.widthMm * activeRoom.depthMm) / 1000000) * 10.7639 * 10) / 10} sq.ft</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 font-bold hidden sm:inline">
            PROJECT TOTAL: {Math.round(project.rooms.reduce((sum, r) => sum + ((r.widthMm * r.depthMm) / 1000000) * 10.7639, 0) * 10) / 10} sq.ft
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">SCALE 1:20</span>
          <span className="font-bold">UNITS: mm</span>
        </div>
      </footer>

      {/* Upload Hand-Drawing / Site Sketch Modal */}
      <SketchUploadModal
        isOpen={isSketchUploadModalOpen}
        onClose={() => setIsSketchUploadModalOpen(false)}
        onApplyToCAD={handleApplyAiSketchRoom}
        project={project}
      />

      {/* Excel Sheet Measurements Auto-Layout Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onApplyProject={(newProj) => {
          setProject(newProj);
          setViewMode('2D_PLAN');
          setActiveTool('SELECT');
        }}
        currentProject={project}
      />

      {/* Start Project / New Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={(newProj) => setProject(newProj)}
      />

      {/* Clear Canvas / Reset Project Modal */}
      <ClearCanvasModal
        isOpen={isClearCanvasModalOpen}
        onClose={() => setIsClearCanvasModalOpen(false)}
        activeRoom={activeRoom}
        project={project}
        onClearFurnitureOnly={handleClearFurnitureOnly}
        onClearEntireRoomCanvas={handleClearEntireRoomCanvas}
        onStartFreshProject={handleStartFreshProject}
      />

      {/* SketchUp (.SKP) Parametric 3D Exporter Modal */}
      <SketchUpExportModal
        isOpen={isSketchUpExportModalOpen}
        onClose={() => setIsSketchUpExportModalOpen(false)}
        project={project}
        activeRoom={activeRoom}
      />
    </div>
  );
}
