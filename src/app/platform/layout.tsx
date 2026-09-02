import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import { PlatformProvider } from "@/platform/store";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "D.Interactive — Digital Interactive Learning Platform",
    template: "%s | D.Interactive",
  },
  description:
    "Turn any school textbook into a hands-on digital classroom. Students drag, drop and play through every subject from Class 1 to 10, while teachers and principals track real learning progress in real time.",
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`platform-theme ${baloo.variable}`}>
      <PlatformProvider>{children}</PlatformProvider>
    </div>
  );
}
