"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/data/testimonials";

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () =>
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  const t = testimonials[index];

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-cream sm:py-28">
      <Quote className="absolute -left-6 -top-6 h-48 w-48 text-cream/5" strokeWidth={1} />
      <div className="container-px relative mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Client Stories"
          title="What Vizag homeowners say about us"
          light
        />

        <div className="relative mt-14 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="mb-5 flex justify-center gap-1 text-gold-light">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="font-display text-balance text-xl leading-relaxed text-cream/90 sm:text-2xl">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gold-light">
                {t.name}
              </p>
              <p className="mt-1 text-xs text-cream/50">
                {t.project} · {t.location}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            aria-label="Previous testimonial"
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 transition-colors hover:border-gold-light hover:text-gold-light"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold-light" : "w-1.5 bg-cream/30"
                }`}
              />
            ))}
          </div>
          <button
            aria-label="Next testimonial"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 transition-colors hover:border-gold-light hover:text-gold-light"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
