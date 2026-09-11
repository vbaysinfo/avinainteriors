import { generateId } from "./id";
import { Material } from "./types";

export const DEFAULT_MATERIALS: Material[] = [
  {
    id: "mat_ply18_mr",
    name: "18mm MR Grade Plywood",
    ratePerSqft: 800,
    ratePerCuft: 1600,
    thicknessMm: 18,
    spec: "18mm, MR (moisture resistant) grade, ISI marked, BWR core",
  },
  {
    id: "mat_ply18_bwp",
    name: "18mm BWP (Waterproof) Plywood",
    ratePerSqft: 950,
    ratePerCuft: 1900,
    thicknessMm: 18,
    spec: "18mm, BWP (boiling waterproof) grade, marine-grade core, ISI marked",
  },
  {
    id: "mat_mdf8",
    name: "8mm MDF Board",
    ratePerSqft: 550,
    ratePerCuft: 1100,
    thicknessMm: 8,
    spec: "8mm medium-density fibreboard, pre-laminated",
  },
  {
    id: "mat_particle18",
    name: "18mm Particle Board",
    ratePerSqft: 600,
    ratePerCuft: 1200,
    thicknessMm: 18,
    spec: "18mm pre-laminated particle board, E1 grade",
  },
  {
    id: "mat_laminate1",
    name: "1mm Laminate Finish",
    ratePerSqft: 120,
    ratePerCuft: 240,
    thicknessMm: 1,
    spec: "1mm decorative laminate, matte/glossy as selected",
  },
  {
    id: "mat_profile_shutter",
    name: "Aluminium Profile Shutter",
    ratePerSqft: 1400,
    ratePerCuft: 2800,
    thicknessMm: 18,
    spec: "Aluminium profile frame with acrylic/glass/PVC infill panel",
  },
  {
    id: "mat_glass",
    name: "5mm Toughened Glass",
    ratePerSqft: 300,
    ratePerCuft: 600,
    thicknessMm: 5,
    spec: "5mm toughened safety glass, clear or frosted",
  },
  {
    id: "mat_hardware",
    name: "Hardware & Accessories",
    ratePerSqft: 0,
    ratePerCuft: 0,
    thicknessMm: 0,
    spec: "Hinges, channels, handles and fittings — priced per component, not per area/volume",
  },
];

/** Looks up a material within a given (project-level) list, falling back to the built-in defaults. */
export function findMaterial(materials: Material[], id: string): Material {
  return (
    materials.find((m) => m.id === id) ??
    DEFAULT_MATERIALS.find((m) => m.id === id) ??
    materials[0] ??
    DEFAULT_MATERIALS[0]
  );
}

/** @deprecated kept for callers that don't yet have a project's material list; prefer findMaterial. */
export function getMaterialById(id: string): Material {
  return DEFAULT_MATERIALS.find((m) => m.id === id) ?? DEFAULT_MATERIALS[0];
}

export function createBlankMaterial(): Material {
  return {
    id: generateId("mat"),
    name: "New Material",
    ratePerSqft: 0,
    ratePerCuft: 0,
    thicknessMm: 18,
    spec: "",
  };
}

export function cloneDefaultMaterials(): Material[] {
  return DEFAULT_MATERIALS.map((m) => ({ ...m }));
}
