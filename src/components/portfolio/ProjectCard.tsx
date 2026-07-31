import { ArrowUpRight, MapPin } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";
import type { Project } from "@/data/projects";

export function ProjectCard({
  project,
  delay = 0,
  onOpen,
}: {
  project: Project;
  delay?: number;
  onOpen: (project: Project) => void;
}) {
  return (
    <Reveal delay={delay}>
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/60 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative h-64 overflow-hidden">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <PlaceholderImage tone={project.tone} label={project.title} icon="Image" />
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
            {project.category}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-xl text-ink">{project.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft/60">
            <MapPin className="h-3.5 w-3.5" /> {project.location}
          </p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft/70">
            {project.summary}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink-soft/60">
            <span>{project.area}</span>
            <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-gold-deep">
              View Gallery
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </button>
    </Reveal>
  );
}
