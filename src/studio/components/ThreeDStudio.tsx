'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ProjectInfo, Room, FurnitureItem, Wall } from '../types/cad';
import { exportToOBJ, downloadFile } from '../utils/cadExport';
import { SketchUpExportModal } from './SketchUpExportModal';
import {
  Box,
  Layers,
  Eye,
  EyeOff,
  Camera,
  Download,
  RefreshCw,
  Sun,
  Compass,
  Sparkles,
  Columns,
  Square,
  Maximize2,
  Check,
} from 'lucide-react';

interface ThreeDStudioProps {
  project: ProjectInfo;
  activeRoom: Room;
  onSelectFurniture?: (id: string | null) => void;
}

export type WallSide = 'front' | 'back' | 'left' | 'right';

export interface WallVisibilityState {
  front: boolean; // Front/South wall (y = depthMm) - default false so wardrobes are unobstructed
  back: boolean;  // Back/North wall (y = 0)
  left: boolean;  // Left/West wall (x = 0)
  right: boolean; // Right/East wall (x = widthMm)
}

export type WallDisplayMode = 'cutaway' | 'all' | 'none' | 'half' | 'glass';

/**
 * Classifies a room wall into one of the 4 cardinal room sides (Front, Back, Left, Right).
 */
export function classifyWallSide(
  w: Wall,
  roomWidth: number,
  roomDepth: number
): WallSide {
  if (w.id === 'w1') return 'back';
  if (w.id === 'w2') return 'right';
  if (w.id === 'w3') return 'front';
  if (w.id === 'w4') return 'left';

  const midX = (w.x1 + w.x2) / 2;
  const midY = (w.y1 + w.y2) / 2;
  const dx = Math.abs(w.x2 - w.x1);
  const dy = Math.abs(w.y2 - w.y1);

  if (dx >= dy) {
    // Horizontal wall: top (back) vs bottom (front)
    return midY >= roomDepth * 0.45 ? 'front' : 'back';
  } else {
    // Vertical wall: left vs right
    return midX <= roomWidth * 0.45 ? 'left' : 'right';
  }
}

export const ThreeDStudio: React.FC<ThreeDStudioProps> = ({ project, activeRoom, onSelectFurniture }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);

  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front' | 'corner'>('iso');
  const [isSketchUpModalOpen, setIsSketchUpModalOpen] = useState<boolean>(false);

  // 4-Side Wall Visibility State (Front wall default to FALSE so wardrobes/cabinets are not blocked)
  const [wallsVisible, setWallsVisible] = useState<WallVisibilityState>({
    front: false, // Front wall removed by default!
    back: true,
    left: true,
    right: true,
  });

  const [wallHeightMode, setWallHeightMode] = useState<WallDisplayMode>('cutaway');
  const [isWallMenuOpen, setIsWallMenuOpen] = useState<boolean>(false);
  const wallMenuRef = useRef<HTMLDivElement>(null);

  // Close wall menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wallMenuRef.current && !wallMenuRef.current.contains(e.target as Node)) {
        setIsWallMenuOpen(false);
      }
    };
    if (isWallMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isWallMenuOpen]);

  // Toggle individual wall side
  const toggleWallSide = (side: WallSide) => {
    setWallsVisible((prev) => {
      const next = { ...prev, [side]: !prev[side] };
      // update mode label if matches a preset
      if (!next.front && next.back && next.left && next.right) {
        setWallHeightMode('cutaway');
      } else if (next.front && next.back && next.left && next.right) {
        setWallHeightMode('all');
      } else if (!next.front && !next.back && !next.left && !next.right) {
        setWallHeightMode('none');
      }
      return next;
    });
  };

  // Apply Wall Preset
  const applyWallPreset = (mode: WallDisplayMode) => {
    setWallHeightMode(mode);
    if (mode === 'cutaway') {
      setWallsVisible({ front: false, back: true, left: true, right: true });
    } else if (mode === 'all') {
      setWallsVisible({ front: true, back: true, left: true, right: true });
    } else if (mode === 'none') {
      setWallsVisible({ front: false, back: false, left: false, right: false });
    } else if (mode === 'half' || mode === 'glass') {
      setWallsVisible({ front: false, back: true, left: true, right: true });
    }
  };

  // Interactive Orbiting state
  const isDraggingRef = useRef<boolean>(false);
  const isRightDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraOrbitRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 4500,
    target: new THREE.Vector3(activeRoom.widthMm / 2, activeRoom.heightMm / 3, activeRoom.depthMm / 2),
  });

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius, target } = cameraOrbitRef.current;
    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  const setCameraView = (view: 'iso' | 'top' | 'front' | 'corner') => {
    setCameraPreset(view);
    const target = new THREE.Vector3(activeRoom.widthMm / 2, activeRoom.heightMm / 3, activeRoom.depthMm / 2);
    cameraOrbitRef.current.target = target;

    if (view === 'iso') {
      cameraOrbitRef.current.theta = Math.PI / 4;
      cameraOrbitRef.current.phi = Math.PI / 3.5;
      cameraOrbitRef.current.radius = Math.max(activeRoom.widthMm, activeRoom.depthMm) * 1.6;
    } else if (view === 'top') {
      cameraOrbitRef.current.theta = 0;
      cameraOrbitRef.current.phi = 0.05;
      cameraOrbitRef.current.radius = Math.max(activeRoom.widthMm, activeRoom.depthMm) * 1.5;
    } else if (view === 'front') {
      cameraOrbitRef.current.theta = 0;
      cameraOrbitRef.current.phi = Math.PI / 2;
      cameraOrbitRef.current.radius = Math.max(activeRoom.widthMm, activeRoom.depthMm) * 1.4;
    } else if (view === 'corner') {
      cameraOrbitRef.current.theta = -Math.PI / 3;
      cameraOrbitRef.current.phi = Math.PI / 3;
      cameraOrbitRef.current.radius = Math.max(activeRoom.widthMm, activeRoom.depthMm) * 1.6;
    }
    updateCameraPosition();
  };

  // Build the 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const sceneBgColor = '#f8fafc';
    scene.background = new THREE.Color(sceneBgColor);
    scene.fog = new THREE.FogExp2(sceneBgColor, 0.00008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 10, 50000);
    cameraRef.current = camera;
    setCameraView('iso');

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting (Warm Interior Architectural Studio Lights)
    const ambientLight = new THREE.AmbientLight('#FFFFFF', 0.95);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight('#FFF7ED', 1.8);
    mainSun.position.set(activeRoom.widthMm * 1.2, 5000, activeRoom.depthMm * 1.5);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 100;
    mainSun.shadow.camera.far = 15000;
    const d = 4000;
    mainSun.shadow.camera.left = -d;
    mainSun.shadow.camera.right = d;
    mainSun.shadow.camera.top = d;
    mainSun.shadow.camera.bottom = -d;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight('#E0F2FE', 0.7);
    fillLight.position.set(-2000, 3000, -2000);
    scene.add(fillLight);

    const ceilingSoftLight = new THREE.PointLight('#FBBF24', 0.8, 6000);
    ceilingSoftLight.position.set(activeRoom.widthMm / 2, activeRoom.heightMm - 200, activeRoom.depthMm / 2);
    scene.add(ceilingSoftLight);

    // Floor Base Slab with fine border
    const floorGeo = new THREE.PlaneGeometry(activeRoom.widthMm, activeRoom.depthMm);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.3,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(activeRoom.widthMm / 2, 0, activeRoom.depthMm / 2);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Floor Perimeter Edge Line (Ensures room boundaries are clear even when walls are hidden)
    const floorBorderGeo = new THREE.BufferGeometry();
    const wMm = activeRoom.widthMm;
    const dMm = activeRoom.depthMm;
    const floorBorderPts = [
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(wMm, 1, 0),
      new THREE.Vector3(wMm, 1, dMm),
      new THREE.Vector3(0, 1, dMm),
      new THREE.Vector3(0, 1, 0),
    ];
    floorBorderGeo.setFromPoints(floorBorderPts);
    const floorBorderMat = new THREE.LineBasicMaterial({ color: '#94a3b8', linewidth: 2 });
    const floorBorderLine = new THREE.Line(floorBorderGeo, floorBorderMat);
    scene.add(floorBorderLine);

    // Subtle Infinite Studio Grid
    const gridHelper = new THREE.GridHelper(12000, 40, '#cbd5e1', '#e2e8f0');
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Walls Rendering with 4-Side Visibility Filters & Height Modes
    const isGlassMode = wallHeightMode === 'glass';
    const isHalfHeight = wallHeightMode === 'half';

    const wallMat = isGlassMode
      ? new THREE.MeshStandardMaterial({
          color: '#cbd5e1',
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        })
      : new THREE.MeshStandardMaterial({
          color: '#94a3b8',
          roughness: 0.8,
          metalness: 0.05,
        });

    activeRoom.walls.forEach((w) => {
      const side = classifyWallSide(w, activeRoom.widthMm, activeRoom.depthMm);

      // Check if this specific wall side is toggled ON
      if (!wallsVisible[side]) {
        return; // Skip rendering hidden wall (e.g. Front Wall)
      }

      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Effective height based on mode
      const effectiveHeight = isHalfHeight ? Math.min(1100, w.height) : w.height;

      const wallGeo = new THREE.BoxGeometry(length, effectiveHeight, w.thickness);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set((w.x1 + w.x2) / 2, effectiveHeight / 2, (w.y1 + w.y2) / 2);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = !isGlassMode;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);

      // Add architectural top cap line to wall for polished look
      const edgeGeo = new THREE.EdgesGeometry(wallGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isGlassMode ? '#64748b' : '#64748b',
        linewidth: 1,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.copy(wallMesh.position);
      edgeLines.rotation.copy(wallMesh.rotation);
      scene.add(edgeLines);
    });

    // Furniture Group
    const furnitureGroup = new THREE.Group();
    furnitureGroupRef.current = furnitureGroup;
    scene.add(furnitureGroup);

    // Render Furniture Objects (Wardrobes, Kitchen Cabinets, TV Units, Beds, etc.)
    activeRoom.furniture.forEach((item) => {
      const { x, y, z, width: w, height: h, depth: d, parametric, materials } = item;
      const isSelected = item.id === project.selectedFurnitureId;

      // Group for this piece
      const pieceGroup = new THREE.Group();
      pieceGroup.name = item.name;
      pieceGroup.userData = { furnitureId: item.id };

      // 1. Carcass Box Mesh
      const carcassMat = new THREE.MeshStandardMaterial({
        color: '#E2E8F0',
        roughness: isWireframe ? 0 : 0.4,
        metalness: 0.05,
        wireframe: isWireframe,
      });
      const carcassGeo = new THREE.BoxGeometry(w, h, d);
      const carcassMesh = new THREE.Mesh(carcassGeo, carcassMat);
      carcassMesh.position.set(w / 2, h / 2, d / 2);
      carcassMesh.castShadow = true;
      carcassMesh.receiveShadow = true;
      pieceGroup.add(carcassMesh);

      // 2. Shutters Mesh (Front Facade)
      const shutterColor = materials.shutterColor || '#FAFAFA';
      const shutterMat = new THREE.MeshStandardMaterial({
        color: shutterColor,
        roughness: isWireframe ? 0 : 0.2,
        metalness: materials.shutterMaterial.toLowerCase().includes('acrylic') ? 0.2 : 0.05,
        wireframe: isWireframe,
      });

      const shutterCount = parametric.shutterCount || 1;
      const shutterThick = 18;
      const skirting = parametric.skirtingHeight || 0;
      const shutterH = h - skirting - 6;

      if (shutterCount > 0 && parametric.shutterType !== 'open') {
        const shutterW = (w - (shutterCount - 1) * 4) / shutterCount;
        for (let sIdx = 0; sIdx < shutterCount; sIdx++) {
          const shutterGeo = new THREE.BoxGeometry(shutterW, shutterH, shutterThick);
          const shutterMesh = new THREE.Mesh(shutterGeo, shutterMat);
          const explodeZ = explodeFactor * 250; // Explode out along Z
          shutterMesh.position.set(
            sIdx * (shutterW + 4) + shutterW / 2,
            skirting + shutterH / 2,
            d + shutterThick / 2 + explodeZ
          );
          shutterMesh.castShadow = true;
          pieceGroup.add(shutterMesh);

          // Handle (G-profile / Lip)
          const handleMat = new THREE.MeshStandardMaterial({ color: '#F59E0B', metalness: 0.8, roughness: 0.2 });
          const handleGeo = new THREE.BoxGeometry(10, 50, 8);
          const handleMesh = new THREE.Mesh(handleGeo, handleMat);
          handleMesh.position.set(
            sIdx * (shutterW + 4) + shutterW - 15,
            skirting + shutterH / 2,
            d + shutterThick + 4 + explodeZ
          );
          pieceGroup.add(handleMesh);
        }
      }

      // 3. Countertop Mesh (if present)
      if (parametric.hasCountertop) {
        const overhang = parametric.countertopOverhang || 25;
        const ctThick = parametric.countertopThickness || 20;
        const counterMat = new THREE.MeshStandardMaterial({
          color: '#EAE6DF',
          roughness: 0.15,
          metalness: 0.2,
          wireframe: isWireframe,
        });
        const counterGeo = new THREE.BoxGeometry(w + overhang * 2, ctThick, d + overhang * 2);
        const counterMesh = new THREE.Mesh(counterGeo, counterMat);
        const explodeY = explodeFactor * 180;
        counterMesh.position.set(w / 2, h + ctThick / 2 + explodeY, d / 2);
        counterMesh.castShadow = true;
        pieceGroup.add(counterMesh);

        // If sink, add SS basin cut
        if (item.catalogId.includes('sink')) {
          const basinMat = new THREE.MeshStandardMaterial({ color: '#38BDF8', metalness: 0.9, roughness: 0.1 });
          const basinGeo = new THREE.BoxGeometry(w * 0.6, 12, d * 0.6);
          const basinMesh = new THREE.Mesh(basinGeo, basinMat);
          basinMesh.position.set(w / 2, h + ctThick + explodeY, d / 2);
          pieceGroup.add(basinMesh);
        }
      }

      // Position whole piece group in room
      pieceGroup.position.set(x, z, y);
      furnitureGroup.add(pieceGroup);

      // Selected Furniture Highlight Box in 3D
      if (isSelected) {
        const boxHelper = new THREE.BoxHelper(pieceGroup, 0x38bdf8);
        (boxHelper.material as THREE.LineBasicMaterial).linewidth = 2;
        scene.add(boxHelper);
      }
    });

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [activeRoom, explodeFactor, isWireframe, project.selectedFurnitureId, wallsVisible, wallHeightMode]);

  // Mouse Orbiting & Selection Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isRightDraggingRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current) {
      // Orbit Rotation
      cameraOrbitRef.current.theta -= deltaX * 0.006;
      cameraOrbitRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.05, cameraOrbitRef.current.phi - deltaY * 0.006));
      updateCameraPosition();
    } else if (isRightDraggingRef.current) {
      // Pan Target
      const panSpeed = 3.0;
      cameraOrbitRef.current.target.x -= deltaX * panSpeed;
      cameraOrbitRef.current.target.z -= deltaY * panSpeed;
      updateCameraPosition();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dist = Math.hypot(
      e.clientX - mouseDownPosRef.current.x,
      e.clientY - mouseDownPosRef.current.y
    );

    // If mouse was clicked without significant dragging, perform raycast selection
    if (dist < 6 && mountRef.current && cameraRef.current && furnitureGroupRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObjects(furnitureGroupRef.current.children, true);

      if (intersects.length > 0) {
        let currentObj: THREE.Object3D | null = intersects[0].object;
        while (currentObj && !currentObj.userData?.furnitureId && currentObj.parent) {
          currentObj = currentObj.parent;
        }
        if (currentObj?.userData?.furnitureId) {
          if (onSelectFurniture) {
            onSelectFurniture(currentObj.userData.furnitureId);
          }
        }
      } else {
        if (onSelectFurniture) {
          onSelectFurniture(null);
        }
      }
    }

    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 2.5;
    cameraOrbitRef.current.radius = Math.max(800, Math.min(15000, cameraOrbitRef.current.radius + e.deltaY * zoomSpeed));
    updateCameraPosition();
  };

  // Export 3D OBJ / SketchUp format
  const handleExportSketchUp = () => {
    const objContent = exportToOBJ(project, activeRoom);
    const filename = `${project.name.replace(/\s+/g, '_')}_${activeRoom.name}_3D_Model.obj`;
    downloadFile(filename, objContent, 'text/plain');
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative select-none bg-slate-100 text-slate-800">
      {/* 3D Viewport Header Toolbar */}
      <div className="h-12 border-b px-4 flex items-center justify-between z-30 bg-white border-slate-200 text-slate-800 shadow-xs flex-wrap gap-2 relative">
        {/* Left: Title & Room Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider">
            3D Studio — {activeRoom.name}
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            {activeRoom.widthMm} × {activeRoom.depthMm} × {activeRoom.heightMm} mm
          </span>
        </div>

        {/* Center: Wall Controls Popup Trigger & Quick Camera Controls */}
        <div className="flex items-center gap-2">
          {/* Wall Controls Dropdown Trigger */}
          <div className="relative" ref={wallMenuRef}>
            <button
              onClick={() => setIsWallMenuOpen(!isWallMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isWallMenuOpen
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400/30'
                  : !wallsVisible.front
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="4-Side Wall Visibility & Cutaway Settings"
            >
              <Columns className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Walls:{' '}
                {wallHeightMode === 'cutaway' && !wallsVisible.front
                  ? 'Cutaway (Front Hidden)'
                  : wallHeightMode === 'none'
                  ? 'No Walls'
                  : wallHeightMode === 'half'
                  ? '1.1m Half Walls'
                  : wallHeightMode === 'glass'
                  ? 'Glass Mode'
                  : 'All 4 Walls'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                !wallsVisible.front ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {[wallsVisible.front, wallsVisible.back, wallsVisible.left, wallsVisible.right].filter(Boolean).length}/4
              </span>
            </button>

            {/* Floating Wall Visibility Popup Menu */}
            {isWallMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-50 text-xs select-none animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>4-Side Wall Visibility</span>
                  </span>
                  <button
                    onClick={() => setIsWallMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Presets Row */}
                <div className="mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-wider">
                    Quick Presets
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => applyWallPreset('cutaway')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-left border transition-all flex items-center justify-between ${
                        wallHeightMode === 'cutaway' && !wallsVisible.front
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🛡️ Cutaway View</span>
                      <span className="text-[9px] text-emerald-700 font-normal">Best for Wardrobes</span>
                    </button>
                    <button
                      onClick={() => applyWallPreset('all')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-left border transition-all flex items-center justify-between ${
                        wallHeightMode === 'all' && wallsVisible.front
                          ? 'bg-blue-50 border-blue-300 text-blue-800 ring-1 ring-blue-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏠 All 4 Walls</span>
                      <span className="text-[9px] text-slate-500">Enclosed</span>
                    </button>
                    <button
                      onClick={() => applyWallPreset('half')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-left border transition-all flex items-center justify-between ${
                        wallHeightMode === 'half'
                          ? 'bg-purple-50 border-purple-300 text-purple-800 ring-1 ring-purple-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>📦 1.1m Half-Wall</span>
                      <span className="text-[9px] text-purple-700">Dollhouse</span>
                    </button>
                    <button
                      onClick={() => applyWallPreset('none')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs text-left border transition-all flex items-center justify-between ${
                        wallHeightMode === 'none'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🔲 No Walls</span>
                      <span className="text-[9px] text-amber-700">Floor Only</span>
                    </button>
                  </div>
                </div>

                {/* 4-Direction Interactive Cardinal Matrix */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1 text-center tracking-wider">
                    Toggle Individual Walls
                  </span>

                  {/* North / Back Wall */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleWallSide('back')}
                      className={`w-36 py-1 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                        wallsVisible.back
                          ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                          : 'bg-white text-slate-400 border-dashed border-slate-300'
                      }`}
                    >
                      {wallsVisible.back ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                      <span>Back (North): {wallsVisible.back ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* West / Left & East / Right Walls */}
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => toggleWallSide('left')}
                      className={`w-28 py-2 rounded-lg text-xs font-bold transition-all border flex flex-col items-center justify-center ${
                        wallsVisible.left
                          ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                          : 'bg-white text-slate-400 border-dashed border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {wallsVisible.left ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                        <span>Left (West)</span>
                      </div>
                      <span className="text-[10px] font-normal">{wallsVisible.left ? 'Visible' : 'Hidden'}</span>
                    </button>

                    {/* Room Center Diagram Indicator */}
                    <div className="flex-1 h-12 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-600 font-mono text-center shadow-inner">
                      <span className="font-bold">{activeRoom.widthMm}</span>
                      <span className="text-[8px] text-slate-400">×</span>
                      <span className="font-bold">{activeRoom.depthMm}</span>
                    </div>

                    <button
                      onClick={() => toggleWallSide('right')}
                      className={`w-28 py-2 rounded-lg text-xs font-bold transition-all border flex flex-col items-center justify-center ${
                        wallsVisible.right
                          ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                          : 'bg-white text-slate-400 border-dashed border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {wallsVisible.right ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                        <span>Right (East)</span>
                      </div>
                      <span className="text-[10px] font-normal">{wallsVisible.right ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>

                  {/* South / Front Wall (The one that blocks wardrobes) */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleWallSide('front')}
                      className={`w-44 py-1.5 rounded-lg text-xs font-extrabold transition-all border flex items-center justify-center gap-1.5 ${
                        wallsVisible.front
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {wallsVisible.front ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-amber-700" />}
                      <span>Front (South): {wallsVisible.front ? 'Visible' : 'Hidden (Clear)'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tip: Keep Front Wall OFF to view wardrobes</span>
                  <button
                    onClick={() => setIsWallMenuOpen(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Camera Preset Buttons & SketchUp Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded border text-xs bg-slate-100 border-slate-200">
            <button
              onClick={() => setCameraView('iso')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                cameraPreset === 'iso'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraView('top')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                cameraPreset === 'top'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Top Plan
            </button>
            <button
              onClick={() => setCameraView('front')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                cameraPreset === 'front'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setCameraView('corner')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                cameraPreset === 'corner'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Corner
            </button>
          </div>

          {/* Export to SketchUp (.SKP) Button */}
          <button
            onClick={() => setIsSketchUpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Export 3D Models to SketchUp (.SKP) with Parametric Data Mapping"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Export SKP</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Mount (100% Unobstructed Full Screen View) */}
      <div
        ref={mountRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-slate-100 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Floating 3D Controls HUD Bar */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 border px-3.5 py-2 rounded-xl shadow-lg z-10 text-xs backdrop-blur-md bg-white/95 border-slate-200 text-slate-800">
        {/* Explode View Slider */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-xs text-slate-700">
            Explode:
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodeFactor}
            onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
            className="w-20 accent-blue-600 cursor-pointer"
          />
          <span className="font-mono w-7 text-xs font-bold text-slate-600">
            {Math.round(explodeFactor * 100)}%
          </span>
        </div>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Wireframe Toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold ${
            isWireframe
              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>{isWireframe ? 'Wireframe ON' : 'Solid Shaded'}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Controls Instructions */}
        <span className="text-[10px] font-mono text-slate-500">
          Left Drag: Rotate • Right Drag: Pan • Scroll: Zoom • Click piece to select
        </span>
      </div>

      {/* SketchUp Parametric 3D Exporter Modal */}
      <SketchUpExportModal
        isOpen={isSketchUpModalOpen}
        onClose={() => setIsSketchUpModalOpen(false)}
        project={project}
        activeRoom={activeRoom}
      />
    </div>
  );
};

