import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "../globals.css";
import { siteConfig } from "@/data/site";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `Factory Design Studio | ${siteConfig.name}`,
  description:
    "Modular interior factory management studio: design rooms to the millimetre, auto-import measurements from Excel, and generate production-ready cutting lists.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StudioRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jost.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-slate-100 text-slate-800">
        {children}
      </body>
    </html>
  );
}
