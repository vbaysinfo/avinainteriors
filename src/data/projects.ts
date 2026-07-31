export type ProjectCategory =
  | "Apartment"
  | "Villa"
  | "Kitchen"
  | "Commercial"
  | "Bedroom"
  | "Living Room";

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  location: string;
  area: string;
  duration: string;
  budget: string;
  year: string;
  tone: "gold" | "forest" | "terracotta" | "ink" | "sand";
  summary: string;
  gallery: number; // number of placeholder images to render
};

export const projects: Project[] = [
  {
    slug: "rushikonda-sea-view-apartment",
    title: "Rushikonda Sea View Apartment",
    category: "Apartment",
    location: "Rushikonda, Visakhapatnam",
    area: "1,850 sq.ft",
    duration: "68 days",
    budget: "₹18.5 Lakhs",
    year: "2025",
    tone: "gold",
    summary:
      "A breezy, contemporary 3BHK designed to frame the coastline with warm oak tones and brass accents.",
    gallery: 6,
  },
  {
    slug: "mvp-colony-4bhk-villa",
    title: "MVP Colony 4BHK Villa",
    category: "Villa",
    location: "MVP Colony, Visakhapatnam",
    area: "3,400 sq.ft",
    duration: "112 days",
    budget: "₹42 Lakhs",
    year: "2024",
    tone: "forest",
    summary:
      "A multi-generational villa balancing traditional warmth with modern minimalism across three floors.",
    gallery: 8,
  },
  {
    slug: "madhurawada-modular-kitchen",
    title: "Madhurawada Modular Kitchen",
    category: "Kitchen",
    location: "Madhurawada, Visakhapatnam",
    area: "180 sq.ft",
    duration: "21 days",
    budget: "₹3.8 Lakhs",
    year: "2025",
    tone: "terracotta",
    summary:
      "A parallel modular kitchen with a breakfast counter, built for a family that loves to cook together.",
    gallery: 5,
  },
  {
    slug: "siripuram-corporate-office",
    title: "Siripuram Corporate Office",
    category: "Commercial",
    location: "Siripuram, Visakhapatnam",
    area: "6,200 sq.ft",
    duration: "45 days",
    budget: "₹65 Lakhs",
    year: "2024",
    tone: "ink",
    summary:
      "A brand-forward workspace fit-out for a fintech company with 120 seats and 6 meeting rooms.",
    gallery: 7,
  },
  {
    slug: "gajuwaka-family-home",
    title: "Gajuwaka Family Home",
    category: "Apartment",
    location: "Gajuwaka, Visakhapatnam",
    area: "1,400 sq.ft",
    duration: "54 days",
    budget: "₹12.9 Lakhs",
    year: "2025",
    tone: "sand",
    summary:
      "A warm, budget-conscious 2BHK makeover that maximises storage without feeling cramped.",
    gallery: 5,
  },
  {
    slug: "beach-road-penthouse-living",
    title: "Beach Road Penthouse Living Room",
    category: "Living Room",
    location: "Beach Road, Visakhapatnam",
    area: "620 sq.ft",
    duration: "30 days",
    budget: "₹9.2 Lakhs",
    year: "2024",
    tone: "gold",
    summary:
      "A double-volume living room with a floating media wall and statement chandelier.",
    gallery: 5,
  },
  {
    slug: "yendada-master-bedroom-suite",
    title: "Yendada Master Bedroom Suite",
    category: "Bedroom",
    location: "Yendada, Visakhapatnam",
    area: "310 sq.ft",
    duration: "18 days",
    budget: "₹5.4 Lakhs",
    year: "2025",
    tone: "terracotta",
    summary:
      "A serene master suite with a walk-in wardrobe and a reading nook by the window.",
    gallery: 4,
  },
  {
    slug: "dwaraka-nagar-boutique-showroom",
    title: "Dwaraka Nagar Boutique Showroom",
    category: "Commercial",
    location: "Dwaraka Nagar, Visakhapatnam",
    area: "1,100 sq.ft",
    duration: "26 days",
    budget: "₹22 Lakhs",
    year: "2024",
    tone: "forest",
    summary:
      "A jewellery boutique fit-out combining museum-style display lighting with a warm, inviting layout.",
    gallery: 6,
  },
  {
    slug: "seethammadhara-duplex",
    title: "Seethammadhara Duplex",
    category: "Villa",
    location: "Seethammadhara, Visakhapatnam",
    area: "2,600 sq.ft",
    duration: "89 days",
    budget: "₹34.5 Lakhs",
    year: "2023",
    tone: "ink",
    summary:
      "A duplex home for a young family blending Scandinavian minimalism with Indian warmth.",
    gallery: 7,
  },
];

export const categories: ProjectCategory[] = [
  "Apartment",
  "Villa",
  "Kitchen",
  "Living Room",
  "Bedroom",
  "Commercial",
];
