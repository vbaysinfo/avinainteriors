import * as icons from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { process } from "@/data/process";

export function ProcessSection() {
  return (
    <section className="bg-sand/50 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Our Process"
          title="A simple, transparent journey to your dream space"
          description="No surprises, no vendor juggling — just five clear steps from first conversation to final handover."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {process.map((item, i) => {
            const Icon = (icons[item.icon as keyof typeof icons] ??
              icons.Sparkles) as icons.LucideIcon;
            return (
              <Reveal key={item.step} delay={i * 0.1} className="relative">
                <div className="flex flex-col">
                  <span className="font-display text-5xl text-sand-dark">
                    {item.step}
                  </span>
                  <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-gold-light">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">
                    {item.description}
                  </p>
                </div>
                {i < process.length - 1 && (
                  <span className="absolute right-[-16px] top-6 hidden h-px w-8 bg-gold/40 lg:block" />
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
