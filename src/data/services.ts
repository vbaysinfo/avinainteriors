export type Service = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: string; // lucide-react icon name
  features: string[];
  image: { tone: "gold" | "forest" | "terracotta" | "ink"; label: string };
  startingPrice?: string;
};

export const services: Service[] = [
  {
    slug: "full-home-interiors",
    title: "Full Home Interiors",
    shortDescription:
      "End-to-end design and execution for apartments, villas and independent houses.",
    description:
      "A single, accountable team handles space planning, design, materials, civil work, and execution — so you get a beautifully finished home without juggling multiple vendors. Every project comes with 3D visualisation before work begins and a fixed-price, fixed-timeline commitment.",
    icon: "Home",
    features: [
      "Free in-home consultation & space audit",
      "Photorealistic 3D design walkthroughs",
      "Single point of contact from design to handover",
      "Fixed cost, fixed timeline contracts",
    ],
    image: { tone: "gold", label: "Full Home Interiors" },
    startingPrice: "₹2,999/sq.ft",
  },
  {
    slug: "modular-kitchen",
    title: "Modular Kitchens",
    shortDescription:
      "Ergonomic, high-utility kitchens in marine ply, WPC and premium laminates.",
    description:
      "Our modular kitchens are engineered around your cooking habits — from L-shaped and parallel layouts to island kitchens — with soft-close hardware, smart storage and premium German/Indian fittings that last a lifetime.",
    icon: "ChefHat",
    features: [
      "100% termite-proof marine ply / WPC carcass",
      "Hettich / Hafele soft-close hardware",
      "Modular trolleys, corner units & tall units",
      "Quartz & granite countertop options",
      "Chimney, hob & sink installation support",
    ],
    image: { tone: "terracotta", label: "Modular Kitchens" },
    startingPrice: "₹1,45,000",
  },
  {
    slug: "wardrobes-storage",
    title: "Wardrobes & Storage",
    shortDescription:
      "Custom sliding, hinged and walk-in wardrobes tailored to every room.",
    description:
      "Storage that disappears into the design. We design wardrobes, crockery units, TV units and study tables that maximise every inch while matching your interior theme.",
    icon: "DoorClosed",
    features: [
      "Sliding, hinged & walk-in configurations",
      "Loft, drawer & accessory organisers",
      "Mirror, glass & laminate shutter finishes",
      "Anti-fungal, moisture-resistant boards",
    ],
    image: { tone: "ink", label: "Wardrobes & Storage" },
    startingPrice: "₹65,000",
  },
  {
    slug: "living-dining",
    title: "Living & Dining Spaces",
    shortDescription:
      "Statement living rooms with false ceilings, TV units and curated furniture.",
    description:
      "The living room sets the tone for your entire home. We design false ceilings, feature walls, lighting layouts and furniture layouts that feel spacious, warm and effortlessly elegant.",
    icon: "Sofa",
    features: [
      "False ceiling & cove lighting design",
      "Feature walls & wall panelling",
      "Curated furniture & soft furnishing",
      "Home automation & smart lighting ready",
    ],
    image: { tone: "gold", label: "Living & Dining" },
    startingPrice: "₹1,10,000",
  },
  {
    slug: "bedroom-interiors",
    title: "Bedroom Interiors",
    shortDescription:
      "Calming, functional bedrooms with wardrobes, back-panels and reading nooks.",
    description:
      "Restful bedrooms designed around light, texture and storage. From master suites to kids' rooms, every layout balances comfort with clean, contemporary aesthetics.",
    icon: "BedDouble",
    features: [
      "Bed back-panelling & headboard design",
      "Integrated wardrobes & dresser units",
      "Reading nooks & study corners",
      "Kid-safe, eco-friendly finishes",
    ],
    image: { tone: "terracotta", label: "Bedroom Interiors" },
    startingPrice: "₹95,000",
  },
  {
    slug: "false-ceiling-lighting",
    title: "False Ceiling & Lighting",
    shortDescription:
      "Layered lighting design and POP/gypsum false ceilings for every room.",
    description:
      "Lighting is the difference between a good interior and a great one. Our design team plans ambient, task and accent lighting alongside custom false ceiling profiles for a premium finish.",
    icon: "Lightbulb",
    features: [
      "Gypsum & POP false ceiling design",
      "Cove, profile & spotlight layouts",
      "Smart & app-controlled lighting",
      "Energy-efficient LED specification",
    ],
    image: { tone: "ink", label: "False Ceiling & Lighting" },
    startingPrice: "₹55/sq.ft",
  },
  {
    slug: "commercial-interiors",
    title: "Office & Commercial Interiors",
    shortDescription:
      "Workspaces, retail stores, clinics and restaurants designed for brand impact.",
    description:
      "We design commercial spaces that reflect your brand and improve how teams and customers experience them — offices, showrooms, clinics, salons and restaurants across Visakhapatnam.",
    icon: "Building2",
    features: [
      "Space planning & workstation layouts",
      "Branding-led reception & facade design",
      "MEP coordination & statutory compliance",
      "Fast-track fit-outs for retail & F&B",
    ],
    image: { tone: "forest", label: "Commercial Interiors" },
    startingPrice: "₹1,499/sq.ft",
  },
  {
    slug: "renovation-remodelling",
    title: "Renovation & Remodelling",
    shortDescription:
      "Refresh existing homes with minimal disruption and maximum transformation.",
    description:
      "Give your existing home a premium makeover — from a single kitchen or bathroom upgrade to a full-home renovation — handled with careful planning to minimise disruption to your routine.",
    icon: "Hammer",
    features: [
      "Structural & civil assessment",
      "Phase-wise execution to minimise disruption",
      "Old furniture reuse & upcycling options",
      "Dust & debris-controlled worksite protocols",
    ],
    image: { tone: "gold", label: "Renovation & Remodelling" },
    startingPrice: "On request",
  },
];

export const getServiceBySlug = (slug: string) =>
  services.find((s) => s.slug === slug);
