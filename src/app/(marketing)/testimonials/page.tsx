import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { GoogleReviews } from "@/components/social/GoogleReviews";
import { CTASection } from "@/components/home/CTASection";
import { testimonials } from "@/data/testimonials";

export const metadata: Metadata = {
  title: "Client Testimonials — Avina Interiors",
  description:
    "Read what homeowners and businesses across Visakhapatnam say about working with Avina Interiors on their interior design projects.",
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Client Stories"
        title="Loved by families across Visakhapatnam"
        description="Real feedback from real clients — because trust is earned project by project."
        crumb="Testimonials"
        icon="MessageSquareQuote"
        tone="forest"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading eyebrow="Reviews" title="What our clients say" />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white/60 p-7">
                  <div className="flex gap-0.5 text-gold-deep">
                    {Array.from({ length: t.rating }).map((_, i2) => (
                      <Star key={i2} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft/80">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 border-t border-ink/10 pt-4">
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-soft/60">
                      {t.project} · {t.location}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <GoogleReviews />
      <CTASection />
    </>
  );
}
