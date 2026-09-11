"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { FileUploadCard } from "@/components/estimator/FileUploadCard";
import { generateId } from "@/lib/estimator/id";
import { DEFAULT_MATERIALS } from "@/lib/estimator/materials";
import { parseProjectJsonFile } from "@/lib/estimator/projectIO";
import { buildSampleProject } from "@/lib/estimator/sampleData";
import { deleteProject, loadProjects, saveProject, subscribeProjects } from "@/lib/estimator/storage";
import { ParsedExcel } from "@/lib/estimator/excelParser";
import { Project, ProjectType, Room } from "@/lib/estimator/types";

const NO_PROJECTS: Project[] = [];
function getServerProjects() {
  return NO_PROJECTS;
}

function blankProject(name: string, clientName: string, projectType: ProjectType): Project {
  const now = new Date().toISOString();
  const room: Room = { id: generateId("room"), name: "Room 1", components: [] };
  return {
    id: generateId("proj"),
    name: name || "Untitled Project",
    clientName,
    siteName: "",
    quotationNo: "",
    date: now.slice(0, 10),
    projectType,
    gstPercent: 18,
    rooms: [room],
    createdAt: now,
    updatedAt: now,
  };
}

function projectFromParsedExcel(parsed: ParsedExcel, name: string, projectType: ProjectType): Project {
  const now = new Date().toISOString();
  return {
    id: generateId("proj"),
    name: name || parsed.siteName || "Imported Project",
    clientName: parsed.clientName,
    siteName: parsed.siteName,
    quotationNo: parsed.quotationNo,
    date: parsed.date || now.slice(0, 10),
    projectType,
    gstPercent: 18,
    rooms: parsed.rooms,
    createdAt: now,
    updatedAt: now,
  };
}

export default function EstimatorDashboard() {
  const router = useRouter();
  const projects = useSyncExternalStore(subscribeProjects, loadProjects, getServerProjects);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("semi");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  function createAndGo(project: Project) {
    saveProject(project);
    router.push(`/estimator/${project.id}`);
  }

  function handleParsed(parsed: ParsedExcel) {
    setImportWarnings(parsed.warnings);
    createAndGo(projectFromParsedExcel(parsed, name, projectType));
  }

  async function handleRestoreFile(file: File) {
    setRestoreError(null);
    try {
      createAndGo(await parseProjectJsonFile(file));
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : "Could not restore this backup file.");
    }
  }

  function handleDelete(id: string) {
    deleteProject(id);
  }

  return (
    <div className="container-px mx-auto max-w-6xl py-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">
        Modular Factory Estimation
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Project Estimator</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/60">
        Upload a client price sheet or start a new project, then generate a room-based 2D
        layout, itemised pricing report, material-wise cutting list, and a client-ready BOM
        proposal — for both Semi Modular (civil-based) and Full Modular (factory prefabricated)
        work.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Start a new project</h2>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/50">
                Project Type
              </span>
              <div className="flex gap-2">
                {(["semi", "full"] as ProjectType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setProjectType(pt)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      projectType === pt
                        ? "border-gold bg-gold/10 text-gold-deep"
                        : "border-ink/15 text-ink/60"
                    }`}
                  >
                    <div className="font-semibold">{pt === "semi" ? "Semi Modular" : "Full Modular"}</div>
                    <div className="mt-0.5 text-[11px] text-ink/50">
                      {pt === "semi"
                        ? "Civil-based. Box/drawer width & height are fixed presets; depth is customisable."
                        : "Factory prefabricated. Every component is a free custom width, height & depth."}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => createAndGo(blankProject(name, clientName, projectType))}
              className="w-full rounded-full bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-cream transition-colors hover:bg-gold-deep"
            >
              Create Blank Project
            </button>
            <button
              onClick={() => createAndGo({ ...buildSampleProject(), projectType })}
              className="w-full rounded-full border border-ink/20 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ink/70 transition-colors hover:border-gold hover:text-gold-deep"
            >
              Load Sample Project
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg text-ink">Or upload an Excel price sheet</h2>
          <FileUploadCard onParsed={handleParsed} />
          {importWarnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-amber-700">
              {importWarnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          ref={restoreInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRestoreFile(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => restoreInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-gold-deep transition-colors"
        >
          <Upload size={14} /> Restore a project from a backup (.json)
        </button>
        {restoreError && <span className="text-xs text-red-600">{restoreError}</span>}
      </div>

      {projects.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-lg text-ink">Your projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects
              .slice()
              .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
              .map((p) => (
                <div
                  key={p.id}
                  className="group relative cursor-pointer rounded-2xl border border-ink/10 bg-white/60 p-4 transition-colors hover:border-gold"
                  onClick={() => router.push(`/estimator/${p.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base text-ink">{p.name}</div>
                      <div className="mt-1 text-xs text-ink/50">
                        {p.clientName || "No client"} · {p.projectType === "semi" ? "Semi Modular" : "Full Modular"}
                      </div>
                      <div className="mt-1 text-[11px] text-ink/40">{p.rooms.length} room(s)</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="text-ink/30 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      aria-label="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="mt-10 max-w-2xl text-[11px] text-ink/40">
        {DEFAULT_MATERIALS.length} default materials preloaded. Projects are saved to this
        browser only (local storage) — no account or server sync yet. Use &ldquo;Backup Project
        (.json)&rdquo; inside a project to move it to another browser or device.
      </p>
    </div>
  );
}
