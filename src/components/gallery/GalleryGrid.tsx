"use client";

import { useState } from "react";
import type * as icons from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { cn } from "@/lib/utils";

type GalleryTone = "gold" | "forest" | "terracotta" | "ink" | "sand";
type IconName = keyof typeof icons;

const items: { category: string; tone: GalleryTone; icon: IconName; span: string }[] = [
  { category: "Living Room", tone: "gold", icon: "Sofa", span: "row-span-2" },
  { category: "Kitchen", tone: "terracotta", icon: "ChefHat", span: "" },
  { category: "Bedroom", tone: "ink", icon: "BedDouble", span: "" },
  { category: "Wardrobe", tone: "sand", icon: "DoorClosed", span: "row-span-2" },
  { category: "Living Room", tone: "forest", icon: "Lamp", span: "" },
  { category: "Kitchen", tone: "gold", icon: "CookingPot", span: "row-span-2" },
  { category: "Commercial", tone: "ink", icon: "Building2", span: "" },
  { category: "Bathroom", tone: "terracotta", icon: "ShowerHead", span: "" },
  { category: "Bedroom", tone: "sand", icon: "BedSingle", span: "" },
  { category: "Living Room", tone: "ink", icon: "Tv", span: "row-span-2" },
  { category: "False Ceiling", tone: "gold", icon: "Lightbulb", span: "" },
  { category: "Kitchen", tone: "forest", icon: "Utensils", span: "" },
  { category: "Wardrobe", tone: "terracotta", icon: "Shirt", span: "" },
  { category: "Commercial", tone: "sand", icon: "Briefcase", span: "row-span-2" },
  { category: "Bedroom", tone: "gold", icon: "Armchair", span: "" },
  { category: "Living Room", tone: "terracotta", icon: "Sparkles", span: "" },
];

const categories = [
  "All",
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Wardrobe",
  "Bathroom",
  "Commercial",
  "False Ceiling",
];

export function GalleryGrid() {
  const [active, setActive] = useState("All");
  const filtered =
    active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-medium transition-colors",
              active === cat
                ? "border-ink bg-ink text-cream"
                : "border-ink/20 text-ink-soft/70 hover:border-gold hover:text-gold-deep"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-12 grid auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[180px] sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item, i) => (
          <div
            key={`${item.category}-${i}`}
            className={cn("overflow-hidden rounded-xl", item.span)}
          >
            <PlaceholderImage
              icon={item.icon}
              tone={item.tone}
              label={item.category}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
