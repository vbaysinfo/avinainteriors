import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import type { LucideIcon } from "lucide-react";
import * as icons from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  description,
  crumb,
  icon = "Sparkles",
  tone = "ink",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  crumb: string;
  icon?: keyof typeof icons;
  tone?: "gold" | "forest" | "terracotta" | "ink" | "sand";
}) {
  const Icon = (icons[icon] ?? icons.Sparkles) as LucideIcon;

  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div className="absolute inset-0 opacity-60">
        <PlaceholderImage tone={tone} label="" showLabel={false} icon={icon} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" />
      <div className="container-px relative mx-auto max-w-7xl">
        <div className="mb-5 flex items-center gap-2 text-xs text-cream/60">
          <Link href="/" className="hover:text-cream">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-cream/80">{crumb}</span>
        </div>
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </p>
        <h1 className="font-display max-w-3xl text-balance text-4xl font-medium leading-tight text-cream sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-balance text-cream/75 sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
