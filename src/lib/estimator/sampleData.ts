import { generateId } from "./id";
import { cloneDefaultMaterials, DEFAULT_MATERIALS } from "./materials";
import { ComponentRow, Project, Room } from "./types";

const ply = DEFAULT_MATERIALS[0];

function row(
  sno: number,
  room: string,
  description: string,
  widthFt: number,
  heightFt: number,
  depthFt: number | null,
  wall: ComponentRow["wall"],
  kind: ComponentRow["kind"],
  rate: number
): ComponentRow {
  return {
    id: generateId("row"),
    sno,
    room,
    description,
    kind,
    widthFt,
    heightFt,
    depthFt,
    wall,
    materialId: ply.id,
    rate,
    qty: 1,
    amountOverride: null,
    remarks: "",
  };
}

export function buildSampleProject(): Project {
  const mbr: Room = {
    id: generateId("room"),
    name: "MBR",
    components: [
      row(1, "MBR", "Wardrobe Shutter", 8, 7, null, "front", "shutter", 800),
      row(2, "MBR", "Loft", 13, 2.2, null, "front", "shutter", 800),
      row(3, "MBR", "Sitting Box", 5, 2, 1.6, "front", "box", 1600),
      row(4, "MBR", "Left Expo", 1.6, 7, null, "left", "panel", 800),
      row(5, "MBR", "Right Expo", 1.6, 7, null, "right", "panel", 800),
    ],
  };

  const kitchen: Room = {
    id: generateId("room"),
    name: "Kitchen",
    components: [
      row(6, "Kitchen", "Loft Shutter Front", 7.6, 2.9, null, "front", "shutter", 800),
      row(7, "Kitchen", "Base 1 Tandem Box", 3, 2.8, 2, "front", "drawer", 1400),
      row(8, "Kitchen", "Base Right", 2.8, 2.8, null, "right", "shutter", 800),
    ],
  };

  const now = new Date().toISOString();
  return {
    id: generateId("proj"),
    name: "Sample Residence",
    clientName: "Demo Client",
    siteName: "Sample Site",
    quotationNo: "Q-DEMO-001",
    date: now.slice(0, 10),
    projectType: "semi",
    gstPercent: 18,
    materials: cloneDefaultMaterials(),
    rooms: [mbr, kitchen],
    createdAt: now,
    updatedAt: now,
  };
}
