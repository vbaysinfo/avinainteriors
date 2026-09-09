import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/services/ServiceCard";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "Interior Design Services in Visakhapatnam",
  description:
    "Explore full-home interiors, modular kitchens, wardrobes, false ceiling & lighting, and commercial fit-outs by Avina Interiors, Visakhapatnam.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Offer"
        title="Interior design services built around how you live"
        description="From a single modular kitchen to a full-home transformation — every service includes free 3D design and a 10-year warranty."
        crumb="Services"
        icon="LayoutGrid"
        tone="forest"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our Services"
            title="Everything your space needs, under one roof"
            description="Every service is delivered by our in-house design and execution team — no third-party contractors, no surprises."
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <ServiceCard key={service.slug} service={service} delay={(i % 3) * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />
    </>
  );
}
