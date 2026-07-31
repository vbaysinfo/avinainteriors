"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { ProjectLightbox } from "@/components/portfolio/ProjectLightbox";
import { categories, projects, type Project, type ProjectCategory } from "@/data/projects";

export function PortfolioGrid() {
  const [active, setActive] = useState<ProjectCategory | "All">("All");
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered =
    active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat as ProjectCategory | "All")}
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

      <motion.div layout className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectCard
                project={project}
                delay={(i % 3) * 0.06}
                onOpen={setSelected}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <ProjectLightbox project={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
