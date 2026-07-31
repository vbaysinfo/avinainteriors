// ---------------------------------------------------------------------------
// Pricing for the "Calculate Now" cost estimator popup.
// Edit the price values below to set your real rates — the popup multiplies
// the selected rate by the square footage the visitor enters. This is a
// simple, approximate estimate, not a final quote.
// ---------------------------------------------------------------------------

export type ServiceType = {
  id: string;
  label: string;
  description: string;
  pricePerSqFt: number; // ₹ per sq.ft — edit this value
};

export const serviceTypes: ServiceType[] = [
  {
    id: "full-modular",
    label: "Full Modular",
    description: "Complete modular furniture across every room",
    pricePerSqFt: 1600,
  },
  {
    id: "semi-modular",
    label: "Semi Modular",
    description: "A mix of modular units and site-built carpentry",
    pricePerSqFt: 900,
  },
];

export function calculateEstimate(sqft: number, serviceTypeId: string) {
  const serviceType = serviceTypes.find((s) => s.id === serviceTypeId);
  if (!sqft || sqft <= 0 || !serviceType) return null;
  const total = sqft * serviceType.pricePerSqFt;
  return {
    total,
    label: `₹${Math.round(total).toLocaleString("en-IN")}`,
  };
}
