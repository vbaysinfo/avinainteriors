// ---------------------------------------------------------------------------
// Central business configuration. Edit the values below to update contact
// details, social links and tracking IDs across the entire website.
// ---------------------------------------------------------------------------

export const siteConfig = {
  name: "Avina Interiors",
  legalName: "Avina Interiors Pvt. Ltd.",
  tagline: "Timeless Interiors, Crafted in Visakhapatnam",
  description:
    "Avina Interiors is a premium interior design studio in Visakhapatnam (Vizag), Andhra Pradesh, crafting bespoke homes, modular kitchens and commercial spaces with a 10-year craftsmanship warranty.",
  url: "https://www.avinainteriors.com",

  // TODO: replace with your real business phone / WhatsApp number (with country code, no spaces, no plus for wa.me)
  phone: "+91 90000 00000",
  whatsappNumber: "919000000000",
  whatsappDefaultMessage:
    "Hi Avina Interiors! I'd like a free interior design consultation.",
  email: "hello@avinainteriors.com",

  address: {
    line1: "Door No. 10-50-12, VIP Road",
    line2: "Siripuram, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    postalCode: "530003",
    country: "IN",
  },

  // Simple query-based embed that works without an API key. For a pin-accurate
  // embed, replace with the "Embed a map" iframe src from Google Maps once you
  // have your exact business location / Place ID — see README.md for steps.
  mapEmbedSrc:
    "https://maps.google.com/maps?q=Siripuram%2C+Visakhapatnam%2C+Andhra+Pradesh&t=&z=14&ie=UTF8&iwloc=&output=embed",

  // TODO: replace with your actual Google Business Profile review link
  googleReviewLink: "https://g.page/r/REPLACE_WITH_YOUR_PLACE_ID/review",
  googleRating: 4.9,
  googleReviewCount: 312,

  businessHours: [
    { day: "Monday – Saturday", hours: "10:00 AM – 8:00 PM" },
    { day: "Sunday", hours: "By appointment" },
  ],

  social: {
    instagram: "https://instagram.com/avinainteriors",
    facebook: "https://facebook.com/avinainteriors",
    youtube: "https://youtube.com/@avinainteriors",
    linkedin: "https://linkedin.com/company/avinainteriors",
    pinterest: "https://pinterest.com/avinainteriors",
  },

  // Optional analytics / tracking — leave blank to disable
  googleAnalyticsId: "", // e.g. "G-XXXXXXXXXX"
  googleAdsConversionId: "", // e.g. "AW-XXXXXXXXX"
  metaPixelId: "", // e.g. "000000000000000"

  stats: [
    { label: "Years of Craftsmanship", value: 12, suffix: "+" },
    { label: "Homes & Spaces Delivered", value: 2400, suffix: "+" },
    { label: "Happy Families", value: 2100, suffix: "+" },
    { label: "Design Awards", value: 18, suffix: "" },
  ],

  serviceAreas: [
    "Visakhapatnam",
    "Vizag Rushikonda",
    "MVP Colony",
    "Madhurawada",
    "Gajuwaka",
    "Rajahmundry",
    "Vizianagaram",
  ],
} as const;

export const whatsappLink = (message?: string) => {
  const text = encodeURIComponent(message ?? siteConfig.whatsappDefaultMessage);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
};

export const telLink = () => `tel:${siteConfig.phone.replace(/\s+/g, "")}`;
export const mailLink = () => `mailto:${siteConfig.email}`;
