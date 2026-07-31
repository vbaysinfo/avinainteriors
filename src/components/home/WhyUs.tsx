import { CheckCircle2 } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

const points = [
  "In-house design & manufacturing — no third-party markups",
  "Photorealistic 3D visualisation before execution begins",
  "Fixed-price, fixed-timeline contracts with penalty clauses",
  "10-year warranty on all modular furniture",
  "Dedicated project manager as your single point of contact",
  "Premium hardware from Hettich, Hafele & trusted Indian brands",
];

export function WhyUs() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="container-px mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 overflow-hidden rounded-2xl sm:h-80">
              <PlaceholderImage tone="gold" label="Craftsmanship" icon="Hammer" />
            </div>
            <div className="mt-8 h-64 overflow-hidden rounded-2xl sm:h-80">
              <PlaceholderImage tone="forest" label="Design Studio" icon="PenTool" />
            </div>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            align="left"
            eyebrow="Why Avina Interiors"
            title="Designed for beauty. Engineered for a lifetime."
            description="We combine the aesthetic sensibility of a boutique design studio with the process discipline of a large-scale execution team — so you never have to choose between design and delivery."
          />
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {points.map((point, i) => (
              <Reveal key={point} delay={i * 0.06}>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                  <span className="text-sm leading-relaxed text-ink-soft/85">
                    {point}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.4}>
            <Button href="/contact" className="mt-9">
              Get in Touch
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
