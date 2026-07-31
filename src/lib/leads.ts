import { siteConfig } from "@/data/site";

export type LeadSource = "Calculate Now Popup" | "Contact Page";

export type LeadPayload = {
  name: string;
  phone: string;
  email?: string;
  bhkType?: string;
  roomsSelected?: string;
  packageTier?: string;
  notes?: string;
  source: LeadSource;
};

// Pushes a row to the Google Sheet configured via siteConfig.googleSheetsWebAppUrl
// (a Google Apps Script Web App bound to the sheet — see README.md). Uses
// mode: "no-cors" since Apps Script web apps don't return CORS headers, so
// the response body is opaque; this is fire-and-forget and never blocks the
// WhatsApp/call fallback that already carries the lead.
export async function submitLead(lead: LeadPayload) {
  if (!siteConfig.googleSheetsWebAppUrl) return;

  const row = {
    timestamp: new Date().toISOString(),
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    bhkType: lead.bhkType ?? "",
    roomsSelected: lead.roomsSelected ?? "",
    package: lead.packageTier ?? "",
    notes: lead.notes ?? "",
    source: lead.source,
  };

  try {
    await fetch(siteConfig.googleSheetsWebAppUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(row),
    });
  } catch {
    // Non-fatal — the lead still reaches the business via WhatsApp/call.
  }
}
