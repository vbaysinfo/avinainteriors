"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { mainNav } from "@/data/nav";
import { siteConfig, telLink } from "@/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent py-5"
          : "bg-cream/95 py-3 shadow-[0_1px_0_0_rgba(23,20,15,0.08)] backdrop-blur-md"
      )}
    >
      <nav className="container-px mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className={cn(
            "font-display text-xl font-semibold tracking-wide sm:text-2xl",
            transparent ? "text-cream" : "text-ink"
          )}
        >
          Avina<span className="text-gold-light">Interiors</span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium uppercase tracking-wide transition-colors",
                  transparent
                    ? "text-cream/85 hover:text-cream"
                    : "text-ink-soft hover:text-gold-deep",
                  active && (transparent ? "text-cream" : "text-gold-deep")
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-current" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={telLink()}
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              transparent ? "text-cream" : "text-ink"
            )}
          >
            <Phone className="h-4 w-4" />
            {siteConfig.phone}
          </a>
          <Button href="/contact" size="sm" variant={transparent ? "ghost" : "primary"}>
            Get Free Quote
          </Button>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border lg:hidden",
            transparent
              ? "border-cream/40 text-cream"
              : "border-ink/20 text-ink"
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-cream lg:hidden"
          >
            <div className="container-px mx-auto flex max-w-7xl flex-col gap-1 pb-6 pt-2">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b border-ink/10 py-3 text-base font-medium text-ink-soft",
                    pathname === item.href && "text-gold-deep"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={telLink()}
                  className="flex items-center gap-2 text-sm font-medium text-ink"
                >
                  <Phone className="h-4 w-4" /> {siteConfig.phone}
                </a>
                <Button href="/contact" className="w-full">
                  Get Free Quote
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
