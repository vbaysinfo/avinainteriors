import { BadgeCheck, Clock, Factory, PenTool, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: PenTool, label: "Free 3D Design" },
  { icon: ShieldCheck, label: "10-Year Warranty" },
  { icon: Clock, label: "On-Time Delivery" },
  { icon: Factory, label: "In-House Manufacturing" },
  { icon: BadgeCheck, label: "Fixed-Price Contracts" },
  { icon: Truck, label: "End-to-End Execution" },
];

export function TrustBar() {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-sand/60 py-4">
      <div className="flex w-max animate-marquee gap-12">
        {loop.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 whitespace-nowrap text-sm font-medium uppercase tracking-wide text-ink-soft/80"
          >
            <Icon className="h-4 w-4 text-gold-deep" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
