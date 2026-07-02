"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { services } from "@/data/services";
import { siteConfig } from "@/data/site";

// NOTE: This form has no backend by default — on submit it opens a
// pre-filled WhatsApp chat with your business number (fastest, most
// reliable lead channel for Indian home-services customers). To also
// receive leads by email, wire this up to a service like Formspree,
// EmailJS, or a Next.js API route that calls your email provider —
// see README.md > "Connecting the contact form".
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: services[0]?.title ?? "",
    budget: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = [
      `Hi ${siteConfig.name}! I'd like a free consultation.`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : null,
      `Interested in: ${form.service}`,
      form.budget ? `Budget: ${form.budget}` : null,
      form.message ? `Message: ${form.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-ink/10 bg-white/60 p-10 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-gold-deep" />
        <h3 className="mt-4 font-display text-2xl text-ink">Thank you!</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/70">
          We&apos;ve opened WhatsApp with your details pre-filled — just hit
          send and our design team will respond shortly. You can also call us
          directly at {siteConfig.phone}.
        </p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>
          Send Another Enquiry
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ink/10 bg-white/60 p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Full Name *
          </label>
          <input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Phone Number *
          </label>
          <input
            required
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 90000 00000"
            className="w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Service Interested In
          </label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            className="w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          >
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Budget Range
          </label>
          <select
            name="budget"
            value={form.budget}
            onChange={handleChange}
            className="w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          >
            <option value="">Select a range (optional)</option>
            <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
            <option value="₹5 – 15 Lakhs">₹5 – 15 Lakhs</option>
            <option value="₹15 – 30 Lakhs">₹15 – 30 Lakhs</option>
            <option value="₹30 Lakhs+">₹30 Lakhs+</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Tell us about your project
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="e.g. 3BHK apartment, looking to start in 2 months..."
            className="w-full resize-none rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="mt-6 w-full sm:w-auto"
        icon={<Send className="h-4 w-4" />}
      >
        Send Enquiry via WhatsApp
      </Button>
      <p className="mt-3 text-xs text-ink-soft/50">
        By submitting, you agree to be contacted by our design team via
        WhatsApp, call or email.
      </p>
    </form>
  );
}
