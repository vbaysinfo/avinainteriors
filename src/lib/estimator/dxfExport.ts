import { computeRow } from "./calc";
import { Project, Wall, WALL_LABELS } from "./types";

// Minimal ASCII DXF (R12 / AC1009) writer. Draws one elevation per wall (Front / Left /
// Right / Back) per room: each component on that wall rendered as a to-scale rectangle
// (LINE entities) with a dimension label (TEXT entity) underneath. Units = millimetres.

const WALL_ORDER: Wall[] = ["front", "left", "right", "back", "unassigned"];
const GAP_MM = 100;
const ROW_MARGIN_MM = 400;
const ROOM_MARGIN_MM = 900;
const TEXT_HEIGHT_MM = 60;

class DxfBuilder {
  private lines: string[] = [];

  header() {
    this.lines.push(
      "0", "SECTION",
      "2", "HEADER",
      "9", "$ACADVER",
      "1", "AC1009",
      "9", "$INSUNITS",
      "70", "4", // millimetres
      "0", "ENDSEC"
    );
  }

  beginEntities() {
    this.lines.push("0", "SECTION", "2", "ENTITIES");
  }

  endEntities() {
    this.lines.push("0", "ENDSEC");
  }

  addLine(x1: number, y1: number, x2: number, y2: number, layer: string) {
    this.lines.push(
      "0", "LINE",
      "8", layer,
      "10", x1.toFixed(2),
      "20", y1.toFixed(2),
      "30", "0",
      "11", x2.toFixed(2),
      "21", y2.toFixed(2),
      "31", "0"
    );
  }

  addRect(x: number, y: number, w: number, h: number, layer: string) {
    this.addLine(x, y, x + w, y, layer);
    this.addLine(x + w, y, x + w, y + h, layer);
    this.addLine(x + w, y + h, x, y + h, layer);
    this.addLine(x, y + h, x, y, layer);
  }

  addText(x: number, y: number, height: number, text: string, layer: string) {
    this.lines.push(
      "0", "TEXT",
      "8", layer,
      "10", x.toFixed(2),
      "20", y.toFixed(2),
      "30", "0",
      "40", height.toFixed(2),
      "1", text.replace(/[\r\n]+/g, " ")
    );
  }

  toString(): string {
    this.lines.push("0", "EOF");
    return this.lines.join("\n");
  }
}

export function exportProjectToDxf(project: Project): string {
  const dxf = new DxfBuilder();
  dxf.header();
  dxf.beginEntities();

  let cursorY = 0;

  for (const room of project.rooms) {
    const computed = room.components.map(computeRow).filter((r) => r.widthMm && r.heightMm);
    if (computed.length === 0) continue;

    dxf.addText(0, cursorY, TEXT_HEIGHT_MM * 1.5, `ROOM: ${room.name.toUpperCase()}`, "TITLES");
    cursorY -= TEXT_HEIGHT_MM * 3;

    for (const wall of WALL_ORDER) {
      const wallRows = computed.filter((r) => r.wall === wall);
      if (wallRows.length === 0) continue;

      dxf.addText(0, cursorY, TEXT_HEIGHT_MM, `${WALL_LABELS[wall]} Elevation`, "LABELS");
      cursorY -= TEXT_HEIGHT_MM * 1.8;

      let cursorX = 0;
      let maxHeight = 0;
      const baselineY = cursorY;

      for (const r of wallRows) {
        const w = r.widthMm as number;
        const h = r.heightMm as number;
        dxf.addRect(cursorX, baselineY - h, w, h, "COMPONENTS");
        const dims = r.depthMm ? `${w}x${h}x${r.depthMm}mm` : `${w}x${h}mm`;
        dxf.addText(cursorX, baselineY - h - TEXT_HEIGHT_MM * 1.3, TEXT_HEIGHT_MM * 0.7, `${r.description} (${dims}) x${r.qty || 1}`, "LABELS");
        cursorX += w + GAP_MM;
        maxHeight = Math.max(maxHeight, h);
      }

      cursorY = baselineY - maxHeight - ROW_MARGIN_MM;
    }

    cursorY -= ROOM_MARGIN_MM;
  }

  dxf.endEntities();
  return dxf.toString();
}

export function downloadDxf(project: Project) {
  const content = exportProjectToDxf(project);
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, "_")}_layout.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
