import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computeProjectTotals, computeRow, generateCutPanels } from "./calc";
import { Project, WALL_LABELS } from "./types";

function money(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function generatePdfProposal(project: Project): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const totals = computeProjectTotals(project.rooms, project.gstPercent);
  const marginX = 40;
  let y = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INTERIOR PROJECT — CLIENT PRICE QUOTATION", marginX, y);
  y += 22;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const projectTypeLabel = project.projectType === "semi" ? "Semi Modular (Civil Based)" : "Full Modular (Factory Prefabricated)";
  const infoLines = [
    [`Client Name: ${project.clientName || "-"}`, `Project / Site: ${project.siteName || "-"}`],
    [`Date: ${project.date || "-"}`, `Quotation No.: ${project.quotationNo || "-"}`],
    [`Project Type: ${projectTypeLabel}`, ""],
  ];
  for (const [left, right] of infoLines) {
    doc.text(left, marginX, y);
    if (right) doc.text(right, 320, y);
    y += 16;
  }
  y += 6;

  for (const room of project.rooms) {
    const computedRows = room.components.map(computeRow);
    if (computedRows.length === 0) continue;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(room.name, marginX, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [140, 100, 56] },
      head: [["S.No", "Description", "W (ft)", "H (ft)", "D (ft)", "Basis", "Area/Vol", "Rate", "Qty", "Amount"]],
      body: computedRows.map((r) => [
        r.sno,
        r.description,
        r.widthFt ?? "-",
        r.heightFt ?? "-",
        r.depthFt ?? "-",
        r.calcBasis === "area" ? "Sq.ft" : r.calcBasis === "volume" ? "Cu.ft" : "-",
        r.areaOrVolume ?? "-",
        r.rate,
        r.qty,
        money(r.amount),
      ]),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  if (y > 680) {
    doc.addPage();
    y = 40;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Pricing Summary", marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 4 },
    body: [
      ["Total Area (Sq.ft)", totals.totalAreaSqft.toString()],
      ["Total Volume (Cu.ft)", totals.totalVolumeCuft.toString()],
      ["Subtotal", money(totals.subtotal)],
      [`GST @ ${project.gstPercent}%`, money(totals.gstAmount)],
      ["Grand Total (incl. GST)", money(totals.grandTotal)],
    ],
    theme: "plain",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 20;

  if (y > 620) {
    doc.addPage();
    y = 40;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Material Usage & Cost", marginX, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [140, 100, 56] },
    head: [["Material", "Area (Sq.ft)", "Volume (Cu.ft)", "Amount"]],
    body: totals.materialUsage.map((m) => [m.materialName, m.areaSqft || "-", m.volumeCuft || "-", money(m.amount)]),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 20;

  doc.addPage();
  y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Bill of Materials — Cutting List", marginX, y);
  y += 14;

  const panels = generateCutPanels(project.rooms);
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [140, 100, 56] },
    head: [["Room", "Wall", "Component", "Panel", "W (mm)", "H (mm)", "Thk (mm)", "Material", "Qty"]],
    body: panels.map((p) => [
      p.room,
      WALL_LABELS[p.wall],
      p.componentDescription,
      p.panelName,
      p.widthMm,
      p.heightMm,
      p.thicknessMm,
      p.materialName,
      p.qty,
    ]),
  });

  return doc;
}

export function downloadPdfProposal(project: Project) {
  const doc = generatePdfProposal(project);
  doc.save(`${project.name.replace(/\s+/g, "_")}_proposal.pdf`);
}
