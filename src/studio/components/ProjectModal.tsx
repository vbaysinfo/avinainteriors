'use client';

import React, { useState } from 'react';
import { ProjectInfo, Room, ProjectType, RoomType } from '../types/cad';
import { FolderPlus, Check } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ProjectInfo) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onCreateProject }) => {
  const [name, setName] = useState<string>('Palm Heights - 3BHK Residence');
  const [customerName, setCustomerName] = useState<string>('Amit Verma');
  const [siteAddress, setSiteAddress] = useState<string>('Flat 802, Orchid Tower, Whitefield, Bangalore');
  const [projectType, setProjectType] = useState<ProjectType>('3BHK');
  const [selectedRooms, setSelectedRooms] = useState<RoomType[]>([
    'Kitchen',
    'Master Bedroom',
    'Living Room',
    'Dining',
  ]);

  if (!isOpen) return null;

  const PROJECT_TYPES: ProjectType[] = ['1BHK', '2BHK', '3BHK', '4BHK', 'Office', 'Shop', 'Custom'];

  const AVAILABLE_ROOMS: RoomType[] = [
    'Living Room',
    'Kitchen',
    'Master Bedroom',
    'Bedroom 2',
    'Bedroom 3',
    'Dining',
    'Pooja',
    'Utility',
    'Office',
    'Custom',
  ];

  const toggleRoom = (room: RoomType) => {
    if (selectedRooms.includes(room)) {
      if (selectedRooms.length > 1) {
        setSelectedRooms(selectedRooms.filter((r) => r !== room));
      }
    } else {
      setSelectedRooms([...selectedRooms, room]);
    }
  };

  const handleCreate = () => {
    const rooms: Room[] = selectedRooms.map((roomType, idx) => {
      const isKitchen = roomType === 'Kitchen';
      const isBed = roomType.includes('Bedroom');
      const widthMm = isKitchen ? 3658 : isBed ? 3962 : 4500;
      const depthMm = isKitchen ? 3048 : isBed ? 3658 : 3600;

      return {
        id: `room_${Date.now()}_${idx}`,
        name: `${roomType} (${Math.round(widthMm / 304.8)}ft × ${Math.round(depthMm / 304.8)}ft)`,
        type: roomType,
        widthMm,
        depthMm,
        heightMm: 2900,
        walls: [
          { id: `w1_${idx}`, x1: 0, y1: 0, x2: widthMm, y2: 0, thickness: 150, height: 2900 },
          { id: `w2_${idx}`, x1: widthMm, y1: 0, x2: widthMm, y2: depthMm, thickness: 150, height: 2900 },
          { id: `w3_${idx}`, x1: widthMm, y1: depthMm, x2: 0, y2: depthMm, thickness: 150, height: 2900 },
          { id: `w4_${idx}`, x1: 0, y1: depthMm, x2: 0, y2: 0, thickness: 150, height: 2900 },
        ],
        doors: [
          { id: `d1_${idx}`, x: widthMm - 1200, y: depthMm, width: 900, height: 2100, wallSide: 'bottom', rotation: 0, swing: 'inward_right' },
        ],
        windows: [
          { id: `win1_${idx}`, x: 1000, y: 0, width: 1200, height: 1200, sillHeight: 900, wallSide: 'top', rotation: 0, type: 'sliding' },
        ],
        columns: [],
        furniture: [],
        dimensions: [
          { id: `dim1_${idx}`, x1: 0, y1: -80, x2: widthMm, y2: -80, offset: 80, textOverride: `${widthMm} mm`, type: 'linear' },
          { id: `dim2_${idx}`, x1: -80, y1: 0, x2: -80, y2: depthMm, offset: 80, textOverride: `${depthMm} mm`, type: 'linear' },
        ],
        textAnnotations: [
          { id: `txt_${idx}`, x: widthMm / 2, y: depthMm / 2, text: roomType.toUpperCase(), fontSize: 160 },
        ],
        sectionCuts: [
          { id: `sec_${idx}`, label: 'Section A-A', x1: 100, y1: 200, x2: widthMm - 100, y2: 200, viewDirection: 'up' },
        ],
      };
    });

    const newProject: ProjectInfo = {
      id: `proj_${Date.now()}`,
      name,
      customerName,
      siteAddress,
      projectType,
      unitSystem: 'mm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rooms,
      activeRoomId: rooms[0].id,
      selectedFurnitureId: null,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full flex flex-col overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Start New Interior CAD Project
              </h2>
              <p className="text-[11px] text-slate-500">
                Set customer info, site specifications & select modular rooms
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-xs hover:bg-slate-200/60 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Project Details */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1 tracking-wider">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1 tracking-wider">Customer / Client Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1 tracking-wider">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1 tracking-wider">Site Address</label>
              <input
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Select Rooms */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1.5 tracking-wider">
              Select Rooms to Design:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_ROOMS.map((room) => {
                const isSelected = selectedRooms.includes(room);
                return (
                  <button
                    key={room}
                    onClick={() => toggleRoom(room)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{room}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
          >
            Initialize CAD Project ({selectedRooms.length} Rooms)
          </button>
        </div>
      </div>
    </div>
  );
};
