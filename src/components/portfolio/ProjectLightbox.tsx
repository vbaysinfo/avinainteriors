"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import type { Project } from "@/data/projects";

export function ProjectLightbox({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [trackedSlug, setTrackedSlug] = useState<string | null>(null);

  if (project && project.slug !== trackedSlug) {
    setTrackedSlug(project.slug);
    setIndex(0);
  }

  useEffect(() => {
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % project.gallery);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + project.gallery) % project.gallery);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} photo gallery`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            aria-label="Close gallery"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex w-full max-w-3xl flex-col"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-video">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full w-full"
                >
                  <PlaceholderImage
                    tone={project.tone}
                    icon="Image"
                    label={`${project.title} — photo ${index + 1}`}
                    showLabel={false}
                  />
                </motion.div>
              </AnimatePresence>

              {project.gallery > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={() =>
                      setIndex((i) => (i - 1 + project.gallery) % project.gallery)
                    }
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-cream backdrop-blur-sm transition-colors hover:bg-ink/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={() => setIndex((i) => (i + 1) % project.gallery)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-cream backdrop-blur-sm transition-colors hover:bg-ink/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                    {index + 1} / {project.gallery}
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-cream/95 p-5 sm:p-6">
              <h3 className="font-display text-xl text-ink sm:text-2xl">
                {project.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft/60">
                <MapPin className="h-3.5 w-3.5" /> {project.location}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft/75">
                {project.summary}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
