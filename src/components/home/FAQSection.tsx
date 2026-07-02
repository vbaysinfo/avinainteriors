import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/shared/FAQAccordion";
import { faqs } from "@/data/faqs";

export function FAQSection() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="FAQs"
          title="Common questions, answered"
          description="Still curious about something? Reach out on WhatsApp and we'll answer personally."
        />
        <div className="mt-14">
          <FAQAccordion items={faqs} />
        </div>
      </div>
    </section>
  );
}
