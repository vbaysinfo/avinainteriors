import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Portfolio — Completed Interior Projects in Visakhapatnam",
  description:
    "Browse apartments, villas, modular kitchens and commercial interiors designed and delivered by Avina Interiors across Visakhapatnam.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Work"
        title="Interiors we've designed & delivered"
        description="Every project below was completed on a fixed timeline with a 10-year warranty on modular work."
        crumb="Portfolio"
        icon="GalleryHorizontalEnd"
        tone="gold"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Filter by Category"
            title="Explore our portfolio"
          />
          <div className="mt-14">
            <PortfolioGrid />
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
