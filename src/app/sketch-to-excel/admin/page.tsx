import type { Metadata } from "next";
import { TemplateAdmin } from "@/components/sketch/TemplateAdmin";

export const metadata: Metadata = {
  title: "Excel template setup",
  robots: { index: false, follow: false },
};

export default function TemplateAdminPage() {
  return <TemplateAdmin />;
}
