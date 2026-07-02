import type { Metadata } from "next";
import * as icons from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";
import { StatsSection } from "@/components/home/StatsSection";
import { CTASection } from "@/components/home/CTASection";
import { team, milestones, values } from "@/data/team";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "About Us — Visakhapatnam's Premium Interior Design Studio",
  description:
    "Learn how Avina Interiors grew from a 3-person studio into one of Visakhapatnam's most trusted end-to-end interior design companies.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Designing Vizag's homes since 2014"
        description="From a small design studio in Siripuram to a full-service interior design company — our mission has never changed: beautiful, functional spaces delivered with honesty."
        crumb="About"
        icon="Users"
        tone="ink"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="h-80 overflow-hidden rounded-2xl sm:h-[420px]">
              <PlaceholderImage tone="sand" label="Our Design Studio" icon="Building2" />
            </div>
          </Reveal>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Who We Are"
              title="A design-first studio, built on craftsmanship"
              description={`${siteConfig.name} is a full-service interior design company based in Visakhapatnam, Andhra Pradesh. We design and execute homes, villas and commercial spaces end-to-end — from the first sketch to the final handover — with our own in-house manufacturing facility.`}
            />
            <p className="mt-6 text-sm leading-relaxed text-ink-soft/70">
              What started as a 3-person studio has grown into a team of
              designers, project managers and craftsmen who&apos;ve delivered over{" "}
              {siteConfig.stats[1].value.toLocaleString("en-IN")} projects
              across Visakhapatnam — without ever compromising on our founding
              promise: honest pricing, dependable timelines, and design that
              lasts.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sand/50 py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="What We Stand For"
            title="The values behind every project"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => {
              const Icon = (icons[value.icon as keyof typeof icons] ??
                icons.Sparkles) as icons.LucideIcon;
              return (
                <Reveal key={value.title} delay={i * 0.1}>
                  <div className="h-full rounded-2xl border border-ink/10 bg-white/60 p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-gold-light">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-display text-lg text-ink">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">
                      {value.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <StatsSection />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-4xl">
          <SectionHeading eyebrow="Our Journey" title="Milestones along the way" />
          <div className="mt-14 space-y-10 border-l border-ink/10 pl-8">
            {milestones.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.08} className="relative">
                <span className="absolute -left-[38px] flex h-5 w-5 items-center justify-center rounded-full bg-gold-deep ring-4 ring-cream" />
                <p className="font-display text-xl text-gold-deep">{m.year}</p>
                <h3 className="mt-1 font-display text-lg text-ink">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft/70">
                  {m.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand/50 py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Meet The Team"
            title="The people behind your project"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.1}>
                <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
                  <div className="aspect-[4/5]">
                    <PlaceholderImage
                      tone={member.tone}
                      icon="UserRound"
                      label=""
                      showLabel={false}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-ink">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-deep">
                      {member.role}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
