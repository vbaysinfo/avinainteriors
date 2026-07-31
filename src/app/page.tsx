import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { WhyUs } from "@/components/home/WhyUs";
import { PortfolioPreview } from "@/components/home/PortfolioPreview";
import { ProcessSection } from "@/components/home/ProcessSection";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { InstagramFeed } from "@/components/social/InstagramFeed";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { FaqJsonLd } from "@/components/shared/JsonLd";
import { faqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Premium Interior Designers in Visakhapatnam",
  description:
    "Avina Interiors designs and builds premium homes, villas, modular kitchens and commercial interiors in Visakhapatnam. Free 3D design, fixed pricing, on-time delivery.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <FaqJsonLd faqs={faqs} />
      <Hero />
      <TrustBar />
      <ServicesPreview />
      <WhyUs />
      <PortfolioPreview />
      <ProcessSection />
      <TestimonialsCarousel />
      <InstagramFeed />
      <FAQSection />
      <CTASection />
    </>
  );
}
