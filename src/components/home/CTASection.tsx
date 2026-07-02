import { ArrowRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { whatsappLink } from "@/data/site";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0">
        <PlaceholderImage tone="gold" label="" showLabel={false} icon="Sparkles" />
      </div>
      <div className="absolute inset-0 bg-ink/70" />
      <div className="container-px relative mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="font-display text-balance text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            Let&apos;s design your dream space in Visakhapatnam
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-cream/80">
            Book a free consultation with our design team — no obligation,
            just honest advice and a clear, itemised quote.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button
              href="/contact"
              size="lg"
              icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            >
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
              WhatsApp Us
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
