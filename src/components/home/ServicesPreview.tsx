import * as icons from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { services } from "@/data/services";

export function ServicesPreview() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="What We Do"
            title="Interior design services, tailored to every space"
            description="From a single modular kitchen to a full villa, our in-house design and execution team handles it all — with one point of contact from start to finish."
            className="ml-0"
          />
          <Reveal delay={0.15}>
            <Button href="/services" variant="secondary" icon={<ArrowUpRight className="h-4 w-4" />}>
              All Services
            </Button>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.slice(0, 8).map((service, i) => {
            const Icon = (icons[service.icon as keyof typeof icons] ??
              icons.Sparkles) as icons.LucideIcon;
            return (
              <Reveal key={service.slug} delay={(i % 4) * 0.08}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-white/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-gold-light transition-colors group-hover:bg-gold-deep">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg text-ink">
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/70">
                    {service.shortDescription}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gold-deep">
                    Explore
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
