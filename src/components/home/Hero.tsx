"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { siteConfig, whatsappLink } from "@/data/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <PlaceholderImage
          tone="ink"
          label=""
          icon="Sparkles"
          showLabel={false}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
      </div>

      <div className="container-px relative z-10 mx-auto grid max-w-7xl gap-10 pb-20 pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pb-28 lg:pt-40">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cream/80 backdrop-blur-sm"
          >
            <MapPin className="h-3.5 w-3.5 text-gold-light" />
            Visakhapatnam, Andhra Pradesh
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-balance text-4xl font-medium leading-[1.08] text-cream sm:text-6xl lg:text-7xl"
          >
            Interiors that feel
            <br />
            <span className="italic text-gold-light">as good as they look</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-cream/75 sm:text-lg"
          >
            Vizag&apos;s premium interior design studio for homes, villas and
            commercial spaces — free 3D design, in-house execution, and a
            10-year warranty on every project.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Button href="/contact" size="lg" icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}>
              Get Free Consultation
            </Button>
            <Button
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="whatsapp"
              icon={<FaWhatsapp className="h-4 w-4" />}
            >
              Chat on WhatsApp
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap gap-6 rounded-2xl border border-cream/15 bg-cream/5 p-6 backdrop-blur-md lg:justify-end"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1 text-gold-light">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
          <div className="w-full text-cream/85">
            <p className="font-display text-2xl">
              {siteConfig.googleRating}/5{" "}
              <span className="text-sm font-sans text-cream/60">
                on Google ({siteConfig.googleReviewCount}+ reviews)
              </span>
            </p>
            <p className="mt-1 text-sm text-cream/60">
              {siteConfig.stats[1].value.toLocaleString("en-IN")}+ homes
              delivered across Visakhapatnam
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream/50 lg:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-cream/40" />
      </motion.div>
    </section>
  );
}
