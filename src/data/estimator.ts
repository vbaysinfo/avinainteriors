// ---------------------------------------------------------------------------
// Data + rule-based pricing for the "Calculate Now" cost estimator popup.
// Numbers are indicative placeholders for a rough, non-binding estimate —
// edit freely to match real pricing.
// ---------------------------------------------------------------------------

export type BhkType = {
  id: string;
  label: string;
  sub: string;
  icon: string; // lucide-react icon name
  baseFee: number; // base design/civil fee at the Basic package tier
};

export const bhkTypes: BhkType[] = [
  { id: "1bhk", label: "1 BHK", sub: "Compact apartment", icon: "Home", baseFee: 50000 },
  { id: "2bhk", label: "2 BHK", sub: "Mid-size apartment", icon: "Home", baseFee: 80000 },
  { id: "3bhk", label: "3 BHK", sub: "Family apartment", icon: "Home", baseFee: 110000 },
  { id: "4bhk", label: "4 BHK", sub: "Large apartment", icon: "Home", baseFee: 150000 },
  { id: "villa", label: "Villa / Duplex", sub: "Independent house", icon: "Building", baseFee: 220000 },
  { id: "commercial", label: "Commercial Space", sub: "Office / retail / clinic", icon: "Building2", baseFee: 180000 },
];

export type RoomOption = {
  id: string;
  label: string;
  icon: string;
  baseCost: number; // per unit, at the Basic package tier
  quantifiable?: boolean; // allow a quantity selector (Bedroom(s), Bathroom(s))
};

export const roomOptions: RoomOption[] = [
  { id: "kitchen", label: "Kitchen", icon: "ChefHat", baseCost: 150000 },
  { id: "living", label: "Living Room", icon: "Sofa", baseCost: 120000 },
  { id: "masterBedroom", label: "Master Bedroom", icon: "BedDouble", baseCost: 90000 },
  { id: "bedrooms", label: "Bedroom(s)", icon: "Bed", baseCost: 70000, quantifiable: true },
  { id: "bathrooms", label: "Bathroom(s)", icon: "ShowerHead", baseCost: 45000, quantifiable: true },
  { id: "dining", label: "Dining Area", icon: "UtensilsCrossed", baseCost: 40000 },
  { id: "balcony", label: "Balcony", icon: "Trees", baseCost: 20000 },
  { id: "pooja", label: "Pooja Room", icon: "Flame", baseCost: 25000 },
];

export type PackageTier = {
  id: string;
  label: string;
  tagline: string;
  multiplier: number;
};

export const packageTiers: PackageTier[] = [
  { id: "basic", label: "Basic", tagline: "Functional, budget-friendly finishes", multiplier: 1 },
  { id: "premium", label: "Premium", tagline: "Elevated materials & custom detailing", multiplier: 1.6 },
  { id: "luxury", label: "Luxury", tagline: "Bespoke design, premium imported finishes", multiplier: 2.4 },
];

export type RoomSelection = Record<string, number>; // roomId -> quantity (0 = not selected)

const formatInr = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export function calculateEstimate(
  bhkId: string,
  rooms: RoomSelection,
  packageId: string
) {
  const bhk = bhkTypes.find((b) => b.id === bhkId);
  const pkg = packageTiers.find((p) => p.id === packageId);
  if (!bhk || !pkg) return null;

  const roomsCost = roomOptions.reduce((sum, room) => {
    const qty = rooms[room.id] ?? 0;
    return sum + room.baseCost * qty;
  }, 0);

  const baseTotal = (bhk.baseFee + roomsCost) * pkg.multiplier;
  const low = baseTotal * 0.9;
  const high = baseTotal * 1.15;

  return {
    low,
    high,
    label: `${formatInr(low)} – ${formatInr(high)}`,
  };
}
