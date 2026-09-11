"use client";

import { computeProjectTotals } from "@/lib/estimator/calc";
import { Project } from "@/lib/estimator/types";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function PricingReport({
  project,
  onGstChange,
}: {
  project: Project;
  onGstChange: (gst: number) => void;
}) {
  const totals = computeProjectTotals(project.rooms, project.gstPercent, project.materials);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Area" value={`${totals.totalAreaSqft} Sq.ft`} />
        <StatCard label="Total Volume" value={`${totals.totalVolumeCuft} Cu.ft`} />
        <StatCard label="Subtotal" value={inr(totals.subtotal)} />
        <StatCard label="Grand Total (incl. GST)" value={inr(totals.grandTotal)} highlight />
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
        <h3 className="mb-3 font-display text-lg text-ink">Room-wise Subtotal</h3>
        <table className="w-full text-sm">
          <tbody>
            {totals.roomSubtotals.map((r) => (
              <tr key={r.room} className="border-b border-ink/5">
                <td className="py-1.5 text-ink/70">{r.room}</td>
                <td className="py-1.5 text-right font-medium text-ink">{inr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
        <h3 className="mb-3 font-display text-lg text-ink">Material Usage & Cost</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/60">
              <th className="py-1.5 font-medium">Material</th>
              <th className="py-1.5 font-medium text-right">Area (Sq.ft)</th>
              <th className="py-1.5 font-medium text-right">Volume (Cu.ft)</th>
              <th className="py-1.5 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {totals.materialUsage.map((m) => (
              <tr key={m.materialId} className="border-b border-ink/5">
                <td className="py-1.5 text-ink/70">
                  {m.materialName}
                  {m.materialSpec && <div className="text-xs text-ink/40">{m.materialSpec}</div>}
                </td>
                <td className="py-1.5 text-right">{m.areaSqft || "-"}</td>
                <td className="py-1.5 text-right">{m.volumeCuft || "-"}</td>
                <td className="py-1.5 text-right font-medium text-ink">{inr(m.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="gst" className="text-ink/70">
              GST %
            </label>
            <input
              id="gst"
              type="number"
              value={project.gstPercent}
              onChange={(e) => onGstChange(parseFloat(e.target.value) || 0)}
              className="w-20 rounded border border-ink/15 bg-white px-2 py-1 focus:border-gold focus:outline-none"
            />
          </div>
          <div className="text-ink/70">GST Amount: <span className="font-medium text-ink">{inr(totals.gstAmount)}</span></div>
          <div className="text-lg font-semibold text-gold-deep">{inr(totals.grandTotal)}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-gold bg-gold/10" : "border-ink/10 bg-white/60"
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-ink/50">{label}</div>
      <div className={`mt-1 font-display text-xl ${highlight ? "text-gold-deep" : "text-ink"}`}>{value}</div>
    </div>
  );
}
