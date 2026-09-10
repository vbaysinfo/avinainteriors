import * as XLSX from "xlsx";
import { inferKindFromText, inferWallFromText } from "./calc";
import { generateId } from "./id";
import { DEFAULT_MATERIALS } from "./materials";
import { ComponentRow, Room } from "./types";

export interface ParsedExcel {
  clientName: string;
  siteName: string;
  quotationNo: string;
  date: string;
  rooms: Room[];
  warnings: string[];
}

type Cell = string | number | null | undefined;

function normalizeHeader(cell: Cell): string {
  return String(cell ?? "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findColumn(headerRow: Cell[], test: (h: string) => boolean): number {
  for (let i = 0; i < headerRow.length; i++) {
    if (test(normalizeHeader(headerRow[i]))) return i;
  }
  return -1;
}

function toNumberOrNull(v: Cell): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function findLabelValue(rows: Cell[][], labelPattern: RegExp, maxRow = 10): string {
  for (let r = 0; r < Math.min(rows.length, maxRow); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (labelPattern.test(String(row[c] ?? ""))) {
        for (let c2 = c + 1; c2 < row.length; c2++) {
          if (row[c2] !== null && row[c2] !== undefined && String(row[c2]).trim() !== "") {
            return String(row[c2]).trim();
          }
        }
      }
    }
  }
  return "";
}

export async function parseExcelFile(file: File): Promise<ParsedExcel> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName =
    workbook.SheetNames.find((n) => /price|quot|estimat|calc/i.test(n)) ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Cell[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const warnings: string[] = [];

  const clientName = findLabelValue(rows, /client name/i);
  const siteName = findLabelValue(rows, /project\s*\/?\s*site/i);
  const quotationNo = findLabelValue(rows, /quotation no/i);
  const date = findLabelValue(rows, /^date/i);

  let headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => /^s\.?\s*no\.?$/i.test(String(cell ?? "").trim()))
  );
  if (headerRowIndex === -1) {
    headerRowIndex = rows.findIndex((row) =>
      row.some((cell) => /room/i.test(String(cell ?? ""))) &&
      row.some((cell) => /width/i.test(String(cell ?? "")))
    );
  }
  if (headerRowIndex === -1) {
    throw new Error(
      "Could not find a header row (expected columns like S.No, Room, Item Description, Width, Height, Depth, Rate)."
    );
  }

  const headerRow = rows[headerRowIndex];
  const col = {
    sno: findColumn(headerRow, (h) => /^s\.?\s*no\.?/.test(h)),
    room: findColumn(headerRow, (h) => h === "room" || h.startsWith("room")),
    description: findColumn(headerRow, (h) => /item|furniture|description/.test(h)),
    widthFt: findColumn(headerRow, (h) => h.includes("width") && !h.includes("mm")),
    heightFt: findColumn(headerRow, (h) => h.includes("height") && !h.includes("mm")),
    depthFt: findColumn(headerRow, (h) => h.includes("depth") && !h.includes("mm")),
    rate: findColumn(headerRow, (h) => h.includes("rate")),
    qty: findColumn(headerRow, (h) => h.includes("qty") || h.includes("quantity")),
    remarks: findColumn(headerRow, (h) => h.includes("remark")),
  };

  if (col.description === -1 || col.widthFt === -1 || col.heightFt === -1) {
    throw new Error(
      "Header row was found but is missing required columns (Item/Furniture Description, Width (ft), Height (ft))."
    );
  }

  const rooms: Room[] = [];
  let currentRoom: Room | null = null;
  let lastRoomName = "";
  let sno = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) {
      continue;
    }

    const description = col.description >= 0 ? String(row[col.description] ?? "").trim() : "";
    const roomCellRaw = col.room >= 0 ? String(row[col.room] ?? "").trim() : "";

    // Stop at the totals/footer block.
    if (/^total\b/i.test(description) || /^total\b/i.test(roomCellRaw) || /^grand total/i.test(description)) {
      break;
    }
    if (!description) continue;

    const roomName = roomCellRaw || lastRoomName || "General";
    lastRoomName = roomName;

    if (!currentRoom || currentRoom.name !== roomName) {
      currentRoom = { id: generateId("room"), name: roomName, components: [] };
      rooms.push(currentRoom);
    }

    const widthFt = toNumberOrNull(row[col.widthFt]);
    const heightFt = toNumberOrNull(row[col.heightFt]);
    const depthFt = col.depthFt >= 0 ? toNumberOrNull(row[col.depthFt]) : null;
    const rateVal = col.rate >= 0 ? toNumberOrNull(row[col.rate]) : null;
    const qtyVal = col.qty >= 0 ? toNumberOrNull(row[col.qty]) : null;
    const remarksVal = col.remarks >= 0 ? String(row[col.remarks] ?? "").trim() : "";

    if (widthFt === null || heightFt === null) {
      warnings.push(`Row ${r + 1} ("${description}") is missing Width or Height and was skipped.`);
      continue;
    }

    const kind = inferKindFromText(description);
    const wall = inferWallFromText(`${roomName} ${description}`);
    const isVolume = depthFt !== null && depthFt > 0;
    const material =
      kind === "shutter" && /profile/i.test(description)
        ? DEFAULT_MATERIALS.find((m) => m.id === "mat_profile_shutter")!
        : DEFAULT_MATERIALS[0];

    sno += 1;
    const component: ComponentRow = {
      id: generateId("row"),
      sno,
      room: roomName,
      description,
      kind,
      widthFt,
      heightFt,
      depthFt: depthFt && depthFt > 0 ? depthFt : null,
      wall,
      materialId: material.id,
      rate: rateVal ?? (isVolume ? material.ratePerCuft : material.ratePerSqft),
      qty: qtyVal ?? 1,
      amountOverride: null,
      remarks: remarksVal,
    };
    currentRoom.components.push(component);
  }

  if (rooms.length === 0) {
    throw new Error("No component rows were found below the header. Check the sheet has data rows with a description, width and height.");
  }

  return { clientName, siteName, quotationNo, date, rooms, warnings };
}
