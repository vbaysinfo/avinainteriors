import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { projects } from "@/data/projects";

export function PortfolioPreview() {
  const featured = projects.slice(0, 6);
  return (
    <section className="bg-sand/50 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Our Portfolio"
            title="Recently completed projects across Visakhapatnam"
            description="A glimpse into homes and workspaces we've designed and delivered — each one backed by a fixed timeline and a 10-year warranty."
            className="ml-0"
          />
          <Reveal delay={0.15}>
            <Button href="/portfolio" variant="secondary" icon={<ArrowUpRight className="h-4 w-4" />}>
              View Full Portfolio
            </Button>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, i) => (
            <ProjectCard key={project.slug} project={project} delay={(i % 3) * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
