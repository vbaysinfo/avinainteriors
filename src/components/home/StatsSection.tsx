import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/data/site";

export function StatsSection() {
  return (
    <section className="bg-ink py-16 text-cream sm:py-20">
      <div className="container-px mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
        {siteConfig.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1} className="text-center">
            <p className="font-display text-4xl text-gold-light sm:text-5xl">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-cream/60 sm:text-sm">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
