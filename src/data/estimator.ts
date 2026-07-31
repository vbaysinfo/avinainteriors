// ---------------------------------------------------------------------------
// Pricing for the "Calculate Now" cost estimator popup.
// Edit PRICE_PER_SQFT below to set your real rate — the popup multiplies
// this by the square footage the visitor enters. This is a simple,
// approximate estimate, not a final quote.
// ---------------------------------------------------------------------------

export const PRICE_PER_SQFT = 1800; // ₹ per sq.ft — edit this value

export function calculateEstimate(sqft: number) {
  if (!sqft || sqft <= 0) return null;
  const total = sqft * PRICE_PER_SQFT;
  return {
    total,
    label: `₹${Math.round(total).toLocaleString("en-IN")}`,
  };
}
