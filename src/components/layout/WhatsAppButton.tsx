"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { siteConfig, whatsappLink } from "@/data/site";

export function WhatsAppButton() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ delay: 1.2, duration: 0.35 }}
            className="hidden max-w-[220px] rounded-2xl rounded-br-sm bg-white p-3 text-sm text-ink shadow-xl sm:block"
          >
            <button
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-cream"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="font-medium">Need free design advice?</p>
            <p className="mt-1 text-xs text-ink-soft/70">
              Chat with our design team on WhatsApp right now.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${siteConfig.name} on WhatsApp`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg animate-pulse-ring sm:h-16 sm:w-16"
      >
        <FaWhatsapp className="h-7 w-7 sm:h-8 sm:w-8" />
      </motion.a>
    </div>
  );
}
