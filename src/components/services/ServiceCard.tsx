import Link from "next/link";
import * as icons from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";
import type { Service } from "@/data/services";

export function ServiceCard({
  service,
  delay = 0,
}: {
  service: Service;
  delay?: number;
}) {
  const Icon = (icons[service.icon as keyof typeof icons] ??
    icons.Sparkles) as icons.LucideIcon;

  return (
    <Reveal delay={delay}>
      <Link
        href={`/services/${service.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative h-52 overflow-hidden">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <PlaceholderImage tone={service.image.tone} label={service.image.label} icon="Image" />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-gold-light">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg text-ink">{service.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/70">
            {service.shortDescription}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-xs">
            <span className="text-ink-soft/60">
              {service.startingPrice ? `From ${service.startingPrice}` : ""}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-gold-deep">
              Learn More
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
