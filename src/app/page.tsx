import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { WhyUs } from "@/components/home/WhyUs";
import { StatsSection } from "@/components/home/StatsSection";
import { PortfolioPreview } from "@/components/home/PortfolioPreview";
import { ProcessSection } from "@/components/home/ProcessSection";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { InstagramFeed } from "@/components/social/InstagramFeed";
import { VideoShowcase } from "@/components/social/VideoShowcase";
import { GoogleReviews } from "@/components/social/GoogleReviews";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { FaqJsonLd } from "@/components/shared/JsonLd";
import { faqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Premium Interior Designers in Visakhapatnam",
  description:
    "Avina Interiors designs and builds premium homes, villas, modular kitchens and commercial interiors in Visakhapatnam. Free 3D design, fixed pricing, 10-year warranty.",
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
      <StatsSection />
      <PortfolioPreview />
      <ProcessSection />
      <TestimonialsCarousel />
      <InstagramFeed />
      <VideoShowcase />
      <GoogleReviews />
      <FAQSection />
      <CTASection />
    </>
  );
}
