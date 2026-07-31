"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, CheckCircle2, Calculator } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { submitLead } from "@/lib/leads";
import { siteConfig, telLink, telLink2, whatsappLink } from "@/data/site";
import { calculateEstimate, PRICE_PER_SQFT } from "@/data/estimator";

export function CalculateNowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [sqft, setSqft] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const reset = () => {
    setSqft("");
    setName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sqftNumber = Number(sqft);
  const estimate = useMemo(() => calculateEstimate(sqftNumber), [sqftNumber]);

  const phoneValid = /^[0-9+\s-]{7,15}$/.test(phone.trim());
  const canSubmit = sqftNumber > 0 && name.trim().length > 1 && phoneValid;

  const confirmationWhatsappMessage = [
    `Hi ${siteConfig.name}! I just used the cost estimator on your website.`,
    `Area: ${sqftNumber.toLocaleString("en-IN")} sq.ft`,
    estimate ? `Estimated cost: ${estimate.label}` : null,
    `Name: ${name}`,
    `Phone: ${phone}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleSubmit = async () => {
    if (!canSubmit || company) return; // honeypot tripped — silently drop
    setSubmitting(true);
    await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: `Area: ${sqftNumber.toLocaleString("en-IN")} sq.ft @ ₹${PRICE_PER_SQFT}/sq.ft = ${estimate?.label ?? ""}`,
      source: "Calculate Now Popup",
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Interior design cost estimator"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:max-h-[88svh] sm:rounded-3xl"
          >
            <button
              aria-label="Close estimator"
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <CheckCircle2 className="mx-auto h-14 w-14 text-gold-deep" />
                    <h3 className="mt-4 font-display text-2xl text-ink sm:text-3xl">
                      Thank you, {name.split(" ")[0]}!
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">
                      Our design expert will contact you shortly.
                    </p>

                    <div className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-5 text-left text-sm">
                      <p className="font-semibold text-ink">Your estimate summary</p>
                      <dl className="mt-3 space-y-1.5 text-ink-soft/80">
                        <div className="flex justify-between gap-3">
                          <dt>Area</dt>
                          <dd className="text-right font-medium text-ink">
                            {sqftNumber.toLocaleString("en-IN")} sq.ft
                          </dd>
                        </div>
                        {estimate && (
                          <div className="mt-2 flex justify-between gap-3 border-t border-ink/10 pt-2 text-base">
                            <dt className="font-semibold text-ink">Approx. estimate</dt>
                            <dd className="text-right font-semibold text-gold-deep">
                              {estimate.label}
                            </dd>
                          </div>
                        )}
                      </dl>
                      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft/50">
                        This is a rough estimate for planning purposes only — not a
                        final quote. Our team will share an itemised quote after a
                        free consultation.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <a
                        href={telLink()}
                        className="flex items-center justify-center gap-2 rounded-full border border-ink/20 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-gold"
                      >
                        <Phone className="h-4 w-4" /> {siteConfig.phone}
                      </a>
                      <a
                        href={telLink2()}
                        className="flex items-center justify-center gap-2 rounded-full border border-ink/20 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-gold"
                      >
                        <Phone className="h-4 w-4" /> {siteConfig.phone2}
                      </a>
                      <a
                        href={whatsappLink(confirmationWhatsappMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1ebe57]"
                      >
                        <FaWhatsapp className="h-4 w-4" /> WhatsApp
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
                        <Calculator className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-display text-2xl text-ink">
                          Get your instant estimate
                        </h2>
                        <p className="text-xs text-ink-soft/60">
                          Enter your space&apos;s area to see an approximate cost
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                          Total Area (sq.ft) *
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          placeholder="e.g. 1200"
                          className="w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-lg font-medium text-ink outline-none transition-colors focus:border-gold"
                        />
                      </div>

                      {estimate && (
                        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink-soft/80">
                          Estimated cost for {sqftNumber.toLocaleString("en-IN")} sq.ft:{" "}
                          <span className="font-semibold text-gold-deep">
                            {estimate.label}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                          Full Name *
                        </label>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                          Phone Number *
                        </label>
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 90000 00000"
                          className="w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
                        />
                      </div>

                      {/* Honeypot — hidden from real users, catches basic bots */}
                      <input
                        type="text"
                        name="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        className="absolute -left-[9999px] h-0 w-0 opacity-0"
                        aria-hidden="true"
                      />

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className={
                          "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-cream transition-all " +
                          (canSubmit && !submitting
                            ? "hover:bg-gold-deep"
                            : "cursor-not-allowed opacity-40")
                        }
                      >
                        {submitting ? "Submitting…" : "Get My Estimate"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
