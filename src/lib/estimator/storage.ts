import { cloneDefaultMaterials } from "./materials";
import { Project } from "./types";

const STORAGE_KEY = "avina_estimator_projects_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

let cache: Project[] | null = null;
const listeners = new Set<() => void>();

/** Backfills fields added after a project may have already been saved (e.g. materials). */
function normalizeProject(project: Project): Project {
  return {
    ...project,
    materials: project.materials?.length ? project.materials : cloneDefaultMaterials(),
  };
}

function readFromStorage(): Project[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProject) : [];
  } catch {
    return [];
  }
}

function setCache(next: Project[]) {
  cache = next;
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

/** Stable-reference read for use as a useSyncExternalStore snapshot. */
export function loadProjects(): Project[] {
  if (cache === null) cache = readFromStorage();
  return cache;
}

export function subscribeProjects(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveProject(project: Project): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const updated = normalizeProject({ ...project, updatedAt: new Date().toISOString() });
  const next = index === -1 ? [...projects, updated] : projects.map((p, i) => (i === index ? updated : p));
  setCache(next);
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function deleteProject(id: string): void {
  setCache(loadProjects().filter((p) => p.id !== id));
}
