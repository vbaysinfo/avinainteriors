import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PageHero } from "@/components/shared/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { FAQSection } from "@/components/home/FAQSection";
import { siteConfig, telLink, telLink2, whatsappLink } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact Us — Free Interior Design Consultation in Visakhapatnam",
  description:
    "Get in touch with Avina Interiors for a free interior design consultation in Visakhapatnam. Call, WhatsApp or visit our Siripuram studio.",
  alternates: { canonical: "/contact" },
};

const infoCards = [
  {
    icon: MapPin,
    title: "Visit Our Studio",
    lines: [
      `${siteConfig.address.line1}, ${siteConfig.address.line2}`,
      `${siteConfig.address.city}, ${siteConfig.address.state} – ${siteConfig.address.postalCode}`,
    ],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: [siteConfig.phone, siteConfig.phone2],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: [siteConfig.email],
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: siteConfig.businessHours.map((b) => `${b.day}: ${b.hours}`),
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Let's talk about your next project"
        description="Book a free, no-obligation consultation — in-home or virtual. We usually respond within a few hours."
        crumb="Contact"
        icon="PhoneCall"
        tone="gold"
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <h2 className="font-display text-2xl text-ink sm:text-3xl">
                Reach us directly
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft/70">
                Prefer to skip the form? Call or message us on WhatsApp and
                our design team will get back to you right away.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button href={telLink()} icon={<Phone className="h-4 w-4" />}>
                  {siteConfig.phone}
                </Button>
                <Button
                  href={telLink2()}
                  variant="secondary"
                  icon={<Phone className="h-4 w-4" />}
                >
                  {siteConfig.phone2}
                </Button>
                <Button
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  icon={<FaWhatsapp className="h-4 w-4" />}
                >
                  WhatsApp Us
                </Button>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {infoCards.map((card, i) => (
                <Reveal key={card.title} delay={0.05 * i}>
                  <div className="h-full rounded-2xl border border-ink/10 bg-white/60 p-5">
                    <card.icon className="h-5 w-5 text-gold-deep" />
                    <h3 className="mt-3 text-sm font-semibold text-ink">
                      {card.title}
                    </h3>
                    {card.lines.map((line) => (
                      <p key={line} className="mt-1 text-sm text-ink-soft/70">
                        {line}
                      </p>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10">
                <iframe
                  src={siteConfig.mapEmbedSrc}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${siteConfig.name} location map`}
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <FAQSection />
    </>
  );
}
