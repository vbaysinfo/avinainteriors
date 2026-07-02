import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { InstagramFeed } from "@/components/social/InstagramFeed";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Interior Design Gallery — Visakhapatnam",
  description:
    "Browse our gallery of living rooms, kitchens, bedrooms, wardrobes and commercial interiors designed by Avina Interiors in Visakhapatnam.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Inspiration"
        title="A visual tour of our design work"
        description="Filter by space to find inspiration for your own home or office."
        crumb="Gallery"
        icon="Images"
        tone="terracotta"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading eyebrow="Browse" title="Explore by room type" />
          <div className="mt-14">
            <GalleryGrid />
          </div>
        </div>
      </section>

      <InstagramFeed />
      <CTASection />
    </>
  );
}
