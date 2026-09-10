import { Material } from "./types";

export const DEFAULT_MATERIALS: Material[] = [
  {
    id: "mat_ply18_mr",
    name: "18mm MR Grade Plywood",
    ratePerSqft: 800,
    ratePerCuft: 1600,
    thicknessMm: 18,
  },
  {
    id: "mat_ply18_bwp",
    name: "18mm BWP (Waterproof) Plywood",
    ratePerSqft: 950,
    ratePerCuft: 1900,
    thicknessMm: 18,
  },
  {
    id: "mat_mdf8",
    name: "8mm MDF Board",
    ratePerSqft: 550,
    ratePerCuft: 1100,
    thicknessMm: 8,
  },
  {
    id: "mat_particle18",
    name: "18mm Particle Board",
    ratePerSqft: 600,
    ratePerCuft: 1200,
    thicknessMm: 18,
  },
  {
    id: "mat_laminate1",
    name: "1mm Laminate Finish",
    ratePerSqft: 120,
    ratePerCuft: 240,
    thicknessMm: 1,
  },
  {
    id: "mat_profile_shutter",
    name: "Aluminium Profile Shutter",
    ratePerSqft: 1400,
    ratePerCuft: 2800,
    thicknessMm: 18,
  },
  {
    id: "mat_glass",
    name: "5mm Toughened Glass",
    ratePerSqft: 300,
    ratePerCuft: 600,
    thicknessMm: 5,
  },
  {
    id: "mat_hardware",
    name: "Hardware & Accessories",
    ratePerSqft: 0,
    ratePerCuft: 0,
    thicknessMm: 0,
  },
];

export function getMaterialById(id: string): Material {
  return (
    DEFAULT_MATERIALS.find((m) => m.id === id) ?? DEFAULT_MATERIALS[0]
  );
}
