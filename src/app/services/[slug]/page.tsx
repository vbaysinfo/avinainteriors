import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as icons from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CTASection } from "@/components/home/CTASection";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { getServiceBySlug, services } from "@/data/services";
import { siteConfig, whatsappLink } from "@/data/site";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.title} in Visakhapatnam`,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const Icon = (icons[service.icon as keyof typeof icons] ??
    icons.Sparkles) as icons.LucideIcon;
  const related = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Services", url: `${siteConfig.url}/services` },
          {
            name: service.title,
            url: `${siteConfig.url}/services/${service.slug}`,
          },
        ]}
      />
      <PageHero
        eyebrow="Service"
        title={service.title}
        description={service.shortDescription}
        crumb={service.title}
        icon={service.icon as keyof typeof icons}
        tone={service.image.tone}
      />

      <section className="bg-cream py-20 sm:py-28">
        <div className="container-px mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="h-80 overflow-hidden rounded-2xl sm:h-[420px]">
              <PlaceholderImage tone={service.image.tone} label={service.image.label} icon="Image" />
            </div>
          </Reveal>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-gold-light">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-3xl text-ink sm:text-4xl">
              {service.title}
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft/75">
              {service.description}
            </p>
            {service.startingPrice && (
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gold-deep">
                Starting from {service.startingPrice}
              </p>
            )}
            <ul className="mt-6 space-y-3">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                  <span className="text-sm leading-relaxed text-ink-soft/85">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button
                href="/contact"
                icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              >
                Get a Free Quote
              </Button>
              <Button
                href={whatsappLink(
                  `Hi! I'm interested in ${service.title.toLowerCase()}. Could you share more details?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                icon={<FaWhatsapp className="h-4 w-4" />}
              >
                Ask on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand/50 py-20 sm:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Explore More"
            title="Other services you might like"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((s, i) => (
              <ServiceCard key={s.slug} service={s} delay={i * 0.1} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="text-sm font-semibold uppercase tracking-wide text-gold-deep hover:underline"
            >
              View all services
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
