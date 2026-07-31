import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa";
import { mainNav } from "@/data/nav";
import { services } from "@/data/services";
import { siteConfig, telLink, telLink2, mailLink } from "@/data/site";

const socialLinks = [
  { href: siteConfig.social.instagram, label: "Instagram", Icon: FaInstagram },
  { href: siteConfig.social.facebook, label: "Facebook", Icon: FaFacebook },
  { href: siteConfig.social.youtube, label: "YouTube", Icon: FaYoutube },
  { href: siteConfig.social.linkedin, label: "LinkedIn", Icon: FaLinkedin },
];

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-2xl font-semibold">
              Avina<span className="text-gold-light">Interiors</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/65">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-gold-light hover:text-gold-light"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Explore</h3>
            <ul className="mt-5 space-y-3">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-cream/70 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Services</h3>
            <ul className="mt-5 space-y-3">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-sm text-cream/70 transition-colors hover:text-cream"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Get in Touch</h3>
            <ul className="mt-5 space-y-4 text-sm text-cream/70">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-gold-light" />
                <span>
                  {siteConfig.address.line1}, {siteConfig.address.line2},{" "}
                  {siteConfig.address.city}, {siteConfig.address.state} –{" "}
                  {siteConfig.address.postalCode}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-gold-light" />
                <span className="flex flex-col">
                  <a href={telLink()} className="hover:text-cream">
                    {siteConfig.phone}
                  </a>
                  <a href={telLink2()} className="hover:text-cream">
                    {siteConfig.phone2}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-gold-light" />
                <a href={mailLink()} className="hover:text-cream">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-gold-light" />
                <span>
                  {siteConfig.businessHours.map((b) => (
                    <span key={b.day} className="block">
                      {b.day}: {b.hours}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 sm:flex-row">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved. Serving {siteConfig.address.city},{" "}
            {siteConfig.address.state}.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-light hover:text-cream"
          >
            Start your project <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
