"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";

/**
 * The marketing site (Navbar/Footer/WhatsApp bubble) and the D.Interactive
 * learning platform live in the same Next.js app but are two different
 * products with two different visual languages. Platform routes render
 * their own shell (see src/app/platform/layout.tsx), so we keep the
 * marketing chrome out of the tree there instead of maintaining two root
 * layouts.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlatform = pathname?.startsWith("/platform");

  if (isPlatform) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTopButton />
    </>
  );
}
