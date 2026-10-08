import type { Metadata } from "next";
import { SketchToExcelApp } from "@/components/sketch/SketchToExcelApp";

export const metadata: Metadata = {
  title: "Sketch to Excel",
  description: "Convert hand-drawn, dimensioned sketches into the price-calculator Excel template.",
  robots: { index: false, follow: false },
};

export default function SketchToExcelPage() {
  return <SketchToExcelApp />;
}
