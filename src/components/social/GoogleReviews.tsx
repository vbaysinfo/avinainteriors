import { Star } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import { testimonials } from "@/data/testimonials";

// NOTE: These are seeded from src/data/testimonials.ts so the section reads
// naturally without a live API key. To show your *real*, live Google
// reviews, wire up the Google Places API (Place Details "reviews" field)
// or embed a widget like Elfsight/EmbedSocial — see README.md for setup.
export function GoogleReviews() {
  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");

  return (
    <section className="bg-sand/50 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Google Reviews"
          title="Trusted by homeowners across Visakhapatnam"
        />

        <Reveal delay={0.1}>
          <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-ink/10 bg-white p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <FaGoogle className="h-8 w-8 text-[#4285F4]" />
              <div>
                <p className="font-display text-2xl text-ink">
                  {siteConfig.googleRating}
                  <span className="text-sm text-ink-soft/60">/5</span>
                </p>
                <div className="flex gap-0.5 text-gold-deep">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <Button
              href={siteConfig.googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="secondary"
            >
              Write a Review
            </Button>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-sm text-gold-light">
                    {initials(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-soft/60">{t.location}</p>
                  </div>
                  <FaGoogle className="ml-auto h-4 w-4 text-[#4285F4]" />
                </div>
                <div className="mt-4 flex gap-0.5 text-gold-deep">
                  {Array.from({ length: t.rating }).map((_, i2) => (
                    <Star key={i2} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft/75">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
