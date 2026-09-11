import { generateId } from "./id";
import { Project } from "./types";

/** Downloads the full project (input sheet, rooms, GST, project type) as a portable JSON file. */
export function downloadProjectJson(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isValidProjectShape(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    Array.isArray(p.rooms) &&
    (p.projectType === "semi" || p.projectType === "full")
  );
}

/**
 * Parses a previously-exported project JSON file. Always issues a fresh project id (and
 * refreshes room/component ids that look malformed) so re-importing a file never collides
 * with — or silently overwrites — a project already saved in this browser.
 */
export async function parseProjectJsonFile(file: File): Promise<Project> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!isValidProjectShape(parsed)) {
    throw new Error(
      "That JSON doesn't look like an exported project (expected name, projectType, and rooms)."
    );
  }

  const now = new Date().toISOString();
  return {
    ...parsed,
    id: generateId("proj"),
    rooms: parsed.rooms.map((room) => ({
      ...room,
      id: room.id || generateId("room"),
      components: room.components.map((c) => ({ ...c, id: c.id || generateId("row") })),
    })),
    createdAt: now,
    updatedAt: now,
  };
}
