"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as icons from "lucide-react";
import { X, ChevronLeft, ChevronRight, Check, Minus, Plus, Phone, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { submitLead } from "@/lib/leads";
import { siteConfig, telLink, telLink2, whatsappLink } from "@/data/site";
import {
  bhkTypes,
  roomOptions,
  packageTiers,
  calculateEstimate,
  type RoomSelection,
} from "@/data/estimator";

const STEP_LABELS = ["BHK Type", "Rooms", "Package", "Your Details"];
const TOTAL_STEPS = STEP_LABELS.length;

type IconName = keyof typeof icons;

function DataIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons[name as IconName] ?? icons.Sparkles) as icons.LucideIcon;
  return <Icon className={className} strokeWidth={1.6} />;
}

const emptyRooms: RoomSelection = {};

export function CalculateNowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [bhkId, setBhkId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomSelection>(emptyRooms);
  const [packageId, setPackageId] = useState<string | null>(null);
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
    setStep(1);
    setBhkId(null);
    setRooms(emptyRooms);
    setPackageId(null);
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

  const toggleRoom = (id: string, quantifiable?: boolean) => {
    setRooms((prev) => {
      const current = prev[id] ?? 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: quantifiable ? 1 : 1 };
    });
  };

  const adjustRoomQty = (id: string, delta: number) => {
    setRooms((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  const selectedBhk = bhkTypes.find((b) => b.id === bhkId);
  const selectedPackage = packageTiers.find((p) => p.id === packageId);
  const selectedRoomEntries = roomOptions.filter((r) => (rooms[r.id] ?? 0) > 0);

  const roomsSummary = useMemo(
    () =>
      selectedRoomEntries
        .map((r) => {
          const qty = rooms[r.id] ?? 0;
          return r.quantifiable && qty > 1 ? `${r.label.replace("(s)", "")} x${qty}` : r.label;
        })
        .join(", "),
    [selectedRoomEntries, rooms]
  );

  const estimate = useMemo(
    () => (bhkId && packageId ? calculateEstimate(bhkId, rooms, packageId) : null),
    [bhkId, rooms, packageId]
  );

  const canProceed =
    (step === 1 && !!bhkId) ||
    (step === 2 && selectedRoomEntries.length > 0) ||
    (step === 3 && !!packageId) ||
    step === 4;

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const phoneValid = /^[0-9+\s-]{7,15}$/.test(phone.trim());
  const canSubmit = name.trim().length > 1 && phoneValid;

  const confirmationWhatsappMessage = [
    `Hi ${siteConfig.name}! I just used the cost estimator on your website.`,
    selectedBhk ? `BHK Type: ${selectedBhk.label}` : null,
    roomsSummary ? `Rooms: ${roomsSummary}` : null,
    selectedPackage ? `Package: ${selectedPackage.label}` : null,
    estimate ? `Estimated range: ${estimate.label}` : null,
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
      bhkType: selectedBhk?.label,
      roomsSelected: roomsSummary,
      packageTier: selectedPackage?.label,
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
            className="relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:max-h-[88svh] sm:rounded-3xl"
          >
            <button
              aria-label="Close estimator"
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {!submitted && (
              <div className="border-b border-ink/10 px-6 pb-5 pt-6 sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                  Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
                </p>
                <h2 className="mt-1.5 font-display text-2xl text-ink sm:text-3xl">
                  Get your free estimate
                </h2>
                <div className="mt-4 flex gap-1.5">
                  {STEP_LABELS.map((label, i) => (
                    <span
                      key={label}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        i < step ? "bg-gold-deep" : "bg-ink/10"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
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
                          <dt>BHK Type</dt>
                          <dd className="text-right font-medium text-ink">{selectedBhk?.label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Rooms</dt>
                          <dd className="text-right font-medium text-ink">{roomsSummary}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Package</dt>
                          <dd className="text-right font-medium text-ink">{selectedPackage?.label}</dd>
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
                        This is a rough, rule-based estimate for planning purposes only — not a
                        final quote. Our team will share an itemised quote after a free
                        consultation.
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
                ) : step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    {bhkTypes.map((bhk) => (
                      <button
                        key={bhk.id}
                        type="button"
                        onClick={() => setBhkId(bhk.id)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                          bhkId === bhk.id
                            ? "border-gold-deep bg-gold/10 shadow-sm"
                            : "border-ink/10 bg-white/60 hover:border-gold/60"
                        )}
                      >
                        <DataIcon name={bhk.icon} className="h-6 w-6 text-gold-deep" />
                        <span className="font-display text-lg text-ink">{bhk.label}</span>
                        <span className="text-xs text-ink-soft/60">{bhk.sub}</span>
                      </button>
                    ))}
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    {roomOptions.map((room) => {
                      const qty = rooms[room.id] ?? 0;
                      const active = qty > 0;
                      return (
                        <div
                          key={room.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
                            active
                              ? "border-gold-deep bg-gold/10 shadow-sm"
                              : "border-ink/10 bg-white/60"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleRoom(room.id, room.quantifiable)}
                            className="flex flex-1 items-center gap-3 text-left"
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                                active
                                  ? "border-gold-deep bg-gold-deep text-cream"
                                  : "border-ink/15 text-gold-deep"
                              )}
                            >
                              {active && !room.quantifiable ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <DataIcon name={room.icon} className="h-4.5 w-4.5" />
                              )}
                            </span>
                            <span className="text-sm font-medium text-ink">{room.label}</span>
                          </button>

                          {room.quantifiable && active ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Decrease ${room.label}`}
                                onClick={() => adjustRoomQty(room.id, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-gold"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-semibold text-ink">
                                {qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase ${room.label}`}
                                onClick={() => adjustRoomQty(room.id, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-gold"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </motion.div>
                ) : step === 3 ? (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                  >
                    {packageTiers.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setPackageId(pkg.id)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all",
                          packageId === pkg.id
                            ? "border-gold-deep bg-gold/10 shadow-sm"
                            : "border-ink/10 bg-white/60 hover:border-gold/60"
                        )}
                      >
                        <span className="font-display text-xl text-ink">{pkg.label}</span>
                        <span className="text-xs leading-relaxed text-ink-soft/60">
                          {pkg.tagline}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="space-y-4"
                  >
                    {estimate && (
                      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink-soft/80">
                        Estimated range for your selection:{" "}
                        <span className="font-semibold text-gold-deep">{estimate.label}</span>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!submitted && (
              <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-6 py-5 sm:px-8">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium text-ink-soft/70 transition-opacity",
                    step === 1 ? "pointer-events-none opacity-0" : "hover:text-ink"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed}
                    className={cn(
                      "group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wider text-cream transition-all",
                      canProceed ? "hover:bg-gold-deep" : "cursor-not-allowed opacity-40"
                    )}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wider text-cream transition-all",
                      canSubmit && !submitting
                        ? "hover:bg-gold-deep"
                        : "cursor-not-allowed opacity-40"
                    )}
                  >
                    {submitting ? "Submitting…" : "Get My Estimate"}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
