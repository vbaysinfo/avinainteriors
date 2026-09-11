"use client";

import { useState } from "react";
import { generateId } from "@/lib/estimator/id";
import { createBlankMaterial } from "@/lib/estimator/materials";
import { emptyComponentRow } from "@/lib/estimator/calc";
import { saveProject } from "@/lib/estimator/storage";
import { ComponentRow, Material, Project, ProjectType, Room } from "@/lib/estimator/types";
import { ComponentTable } from "./ComponentTable";
import { RoomLayoutView } from "./RoomLayoutView";
import { PricingReport } from "./PricingReport";
import { CuttingList } from "./CuttingList";
import { ExportButtons } from "./ExportButtons";
import { MaterialsPanel } from "./MaterialsPanel";

type Tab = "input" | "layout" | "cutlist" | "pricing" | "materials";

const TABS: { id: Tab; label: string }[] = [
  { id: "input", label: "Input Sheet" },
  { id: "layout", label: "2D Layout" },
  { id: "cutlist", label: "Cutting List" },
  { id: "pricing", label: "Pricing Report" },
  { id: "materials", label: "Materials" },
];

export function EstimatorWorkspace({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [tab, setTab] = useState<Tab>("input");

  function persist(next: Project) {
    setProject(next);
    saveProject(next);
  }

  function updateMeta(patch: Partial<Project>) {
    persist({ ...project, ...patch });
  }

  function updateRow(roomId: string, rowId: string, patch: Partial<ComponentRow>) {
    persist({
      ...project,
      rooms: project.rooms.map((r) =>
        r.id !== roomId
          ? r
          : { ...r, components: r.components.map((c) => (c.id === rowId ? { ...c, ...patch } : c)) }
      ),
    });
  }

  function addRow(roomId: string) {
    persist({
      ...project,
      rooms: project.rooms.map((r) =>
        r.id !== roomId
          ? r
          : {
              ...r,
              components: [...r.components, emptyComponentRow(r.components.length + 1, project.materials[0])],
            }
      ),
    });
  }

  function removeRow(roomId: string, rowId: string) {
    persist({
      ...project,
      rooms: project.rooms.map((r) =>
        r.id !== roomId ? r : { ...r, components: r.components.filter((c) => c.id !== rowId) }
      ),
    });
  }

  function duplicateRow(roomId: string, rowId: string) {
    persist({
      ...project,
      rooms: project.rooms.map((r) => {
        if (r.id !== roomId) return r;
        const index = r.components.findIndex((c) => c.id === rowId);
        if (index === -1) return r;
        const copy = { ...r.components[index], id: generateId("row"), sno: r.components.length + 1 };
        const components = [...r.components];
        components.splice(index + 1, 0, copy);
        return { ...r, components };
      }),
    });
  }

  function addRoom() {
    const room: Room = { id: generateId("room"), name: `Room ${project.rooms.length + 1}`, components: [] };
    persist({ ...project, rooms: [...project.rooms, room] });
  }

  function removeRoom(roomId: string) {
    persist({ ...project, rooms: project.rooms.filter((r) => r.id !== roomId) });
  }

  function renameRoom(roomId: string, name: string) {
    persist({ ...project, rooms: project.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)) });
  }

  function addMaterial() {
    persist({ ...project, materials: [...project.materials, createBlankMaterial()] });
  }

  function updateMaterial(materialId: string, patch: Partial<Material>) {
    persist({
      ...project,
      materials: project.materials.map((m) => (m.id === materialId ? { ...m, ...patch } : m)),
    });
  }

  function removeMaterial(materialId: string) {
    if (project.materials.length <= 1) return;
    persist({ ...project, materials: project.materials.filter((m) => m.id !== materialId) });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <input
            value={project.name}
            onChange={(e) => updateMeta({ name: e.target.value })}
            className="font-display text-2xl text-ink focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/60">
            <ProjectTypeToggle
              value={project.projectType}
              onChange={(pt) => updateMeta({ projectType: pt })}
            />
            <input
              value={project.clientName}
              onChange={(e) => updateMeta({ clientName: e.target.value })}
              placeholder="Client name"
              className="rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
            />
            <input
              value={project.siteName}
              onChange={(e) => updateMeta({ siteName: e.target.value })}
              placeholder="Project / site"
              className="rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <ExportButtons project={project} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-gold text-gold-deep"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "input" && (
        <div className="space-y-5">
          {project.rooms.map((room) => (
            <ComponentTable
              key={room.id}
              room={room}
              projectType={project.projectType}
              materials={project.materials}
              onUpdateRow={(rowId, patch) => updateRow(room.id, rowId, patch)}
              onAddRow={() => addRow(room.id)}
              onRemoveRow={(rowId) => removeRow(room.id, rowId)}
              onDuplicateRow={(rowId) => duplicateRow(room.id, rowId)}
              onRemoveRoom={() => removeRoom(room.id)}
              onRenameRoom={(name) => renameRoom(room.id, name)}
            />
          ))}
          <button
            onClick={addRoom}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink/70 hover:border-gold hover:text-gold-deep transition-colors"
          >
            + Add room
          </button>
        </div>
      )}

      {tab === "layout" && (
        <div className="space-y-5">
          {project.rooms.map((room) => (
            <RoomLayoutView key={room.id} room={room} />
          ))}
        </div>
      )}

      {tab === "cutlist" && <CuttingList project={project} />}

      {tab === "pricing" && (
        <PricingReport project={project} onGstChange={(gst) => updateMeta({ gstPercent: gst })} />
      )}

      {tab === "materials" && (
        <MaterialsPanel
          materials={project.materials}
          onAdd={addMaterial}
          onUpdate={updateMaterial}
          onRemove={removeMaterial}
        />
      )}
    </div>
  );
}

function ProjectTypeToggle({
  value,
  onChange,
}: {
  value: ProjectType;
  onChange: (v: ProjectType) => void;
}) {
  return (
    <div className="flex rounded-full border border-ink/15 bg-white/70 p-0.5">
      {(["semi", "full"] as ProjectType[]).map((pt) => (
        <button
          key={pt}
          onClick={() => onChange(pt)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === pt ? "bg-ink text-cream" : "text-ink/60"
          }`}
        >
          {pt === "semi" ? "Semi Modular" : "Full Modular"}
        </button>
      ))}
    </div>
  );
}
