import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, IndianRupee, MapPin, Ruler } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { CTASection } from "@/components/home/CTASection";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { getProjectBySlug, projects } from "@/data/projects";
import { siteConfig, whatsappLink } from "@/data/site";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} | Portfolio`,
    description: project.summary,
    alternates: { canonical: `/portfolio/${project.slug}` },
  };
}

const facts = (project: NonNullable<ReturnType<typeof getProjectBySlug>>) => [
  { icon: MapPin, label: "Location", value: project.location },
  { icon: Ruler, label: "Area", value: project.area },
  { icon: Calendar, label: "Duration", value: project.duration },
  { icon: IndianRupee, label: "Budget", value: project.budget },
];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const related = projects
    .filter((p) => p.slug !== project.slug && p.category === project.category)
    .slice(0, 3);
  const fallbackRelated =
    related.length > 0
      ? related
      : projects.filter((p) => p.slug !== project.slug).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Portfolio", url: `${siteConfig.url}/portfolio` },
          {
            name: project.title,
            url: `${siteConfig.url}/portfolio/${project.slug}`,
          },
        ]}
      />
      <PageHero
        eyebrow={project.category}
        title={project.title}
        description={project.summary}
        crumb={project.title}
        icon="Image"
        tone={project.tone}
      />

      <section className="bg-cream py-16">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white/60 p-6 sm:grid-cols-4">
            {facts(project).map((fact) => (
              <div key={fact.label} className="flex items-center gap-3">
                <fact.icon className="h-5 w-5 shrink-0 text-gold-deep" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft/50">
                    {fact.label}
                  </p>
                  <p className="text-sm font-medium text-ink">{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream pb-20 sm:pb-28">
        <div className="container-px mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Reveal>
              <h2 className="font-display text-2xl text-ink sm:text-3xl">
                Project Overview
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft/75">
                {project.description}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h3 className="mt-10 font-display text-xl text-ink">
                Design Highlights
              </h3>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-xl border border-ink/10 bg-white/60 p-4 text-sm text-ink-soft/80"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.15}>
              <h3 className="mt-10 font-display text-xl text-ink">Gallery</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: project.gallery }).map((_, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl">
                    <PlaceholderImage
                      tone={project.tone}
                      icon="Image"
                      label=""
                      showLabel={false}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-ink/10 bg-sand/50 p-8">
              <h3 className="font-display text-xl text-ink">
                Loved this project?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft/70">
                Let&apos;s design something just as beautiful for your home.
                Book a free consultation with our design team today.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  href="/contact"
                  icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                >
                  Get Free Consultation
                </Button>
                <Button
                  href={whatsappLink(
                    `Hi! I saw your ${project.title} project and would love a similar consultation.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  icon={<FaWhatsapp className="h-4 w-4" />}
                >
                  WhatsApp Us
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-sand/50 py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading eyebrow="Related" title="More projects you might like" />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {fallbackRelated.map((p, i) => (
              <ProjectCard key={p.slug} project={p} delay={i * 0.1} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/portfolio"
              className="text-sm font-semibold uppercase tracking-wide text-gold-deep hover:underline"
            >
              View full portfolio
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
