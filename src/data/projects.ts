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
  description: string;
  highlights: string[];
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
    description:
      "This 3BHK apartment overlooking the Bay of Bengal called for a design that let the sea view lead. We used a warm, neutral palette with oak-finish woodwork, brushed brass hardware and sheer drapery to keep the living spaces airy while adding a media wall, false ceiling coves and a fully modular kitchen.",
    highlights: [
      "Panoramic living room media wall with hidden storage",
      "Island-style modular kitchen with quartz counters",
      "Custom wardrobes across 3 bedrooms",
      "Cove lighting & smart switches throughout",
    ],
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
    description:
      "Designed for a joint family, this villa needed distinct zones for every generation while staying cohesive. We used a restrained material palette — teak, limewash walls and terrazzo accents — carried consistently from the double-height foyer to the rooftop lounge.",
    highlights: [
      "Double-height foyer with statement staircase",
      "Home temple with backlit jaali screen",
      "Rooftop entertainment lounge",
      "Independent modular kitchens on 2 floors",
    ],
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
    description:
      "A compact parallel kitchen reimagined with tall units, a corner carousel, and a breakfast counter that doubles as a casual dining spot. Quartz counters and a matte laminate finish keep maintenance effortless.",
    highlights: [
      "Parallel layout with breakfast counter",
      "Soft-close tall units & corner carousel",
      "Under-cabinet LED task lighting",
      "Chimney & hob integrated countertop",
    ],
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
    description:
      "This fast-track fit-out balanced brand identity with employee wellbeing — biophilic breakout zones, acoustic meeting pods, and an open-plan layout that improved collaboration without sacrificing focus areas.",
    highlights: [
      "120-seat open workstation layout",
      "6 acoustic-treated meeting rooms",
      "Branded reception & lobby experience",
      "Biophilic breakout & cafeteria zone",
    ],
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
    description:
      "Working within a tight footprint, we prioritised smart storage — loft units, a foldable study desk, and a sliding-door wardrobe wall — while keeping the material palette light to make the home feel larger.",
    highlights: [
      "Space-maximising sliding wardrobe wall",
      "Foldable study & work-from-home desk",
      "Light oak & white palette for openness",
      "Modular kitchen with tall pull-out units",
    ],
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
    description:
      "The brief was 'quiet luxury' — a restrained palette of ivory, walnut and brass, anchored by a floating entertainment unit and a hand-picked Italian chandelier as the room's centrepiece.",
    highlights: [
      "Floating walnut & brass media wall",
      "Statement chandelier & cove lighting",
      "Custom sofa-set & drapery styling",
      "Integrated home theatre wiring",
    ],
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
    description:
      "Designed for rest, this suite features a low-profile upholstered bed, a walk-in wardrobe finished in soft matte laminate, and a window-side reading nook with warm accent lighting.",
    highlights: [
      "Walk-in wardrobe with backlit mirror",
      "Upholstered bed with hidden storage",
      "Reading nook with warm accent lighting",
      "Blackout drapery & acoustic detailing",
    ],
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
    description:
      "Every display case in this boutique was custom-built with layered lighting to make the products the hero — paired with a soft, welcoming seating lounge for private consultations.",
    highlights: [
      "Museum-grade display case lighting",
      "Custom facade & signage design",
      "Private consultation lounge",
      "CCTV & security-integrated design",
    ],
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
    description:
      "This duplex combines a light Scandinavian material palette — white oak, linen and matte black hardware — with warm Indian textiles and a puja room finished in traditional teak detailing.",
    highlights: [
      "Scandinavian-inspired open kitchen & dining",
      "Teak-detailed traditional puja room",
      "Skylight-lit internal staircase",
      "Kids' zone with modular study furniture",
    ],
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

export const getProjectBySlug = (slug: string) =>
  projects.find((p) => p.slug === slug);
