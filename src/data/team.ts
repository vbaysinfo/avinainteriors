export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  tone: "gold" | "forest" | "terracotta" | "ink" | "sand";
};

export const team: TeamMember[] = [
  {
    name: "Ar. Vishnu Bala",
    role: "Founder & Principal Designer",
    bio: "12+ years designing homes across Vizag, blending functional planning with warm, livable aesthetics.",
    tone: "gold",
  },
  {
    name: "Sowmya Krishnan",
    role: "Head of Interior Design",
    bio: "Leads the design studio with a focus on space planning, material selection and lighting design.",
    tone: "terracotta",
  },
  {
    name: "Ravi Shankar",
    role: "Head of Production",
    bio: "Oversees our in-house manufacturing facility, ensuring every module meets a 10-year quality standard.",
    tone: "forest",
  },
  {
    name: "Divya Nair",
    role: "Client Experience Manager",
    bio: "Your single point of contact — coordinating design, execution and handover from day one.",
    tone: "ink",
  },
];

export const milestones = [
  { year: "2014", title: "Studio Founded", description: "Avina Interiors began as a 3-person design studio in Siripuram, Visakhapatnam." },
  { year: "2017", title: "In-House Manufacturing", description: "Launched our own production facility to control quality and cut delivery times." },
  { year: "2020", title: "500+ Homes Delivered", description: "Crossed 500 completed residential projects across Vizag and surrounding areas." },
  { year: "2023", title: "Commercial Division Launched", description: "Expanded into office, retail and hospitality fit-outs across Andhra Pradesh." },
  { year: "2026", title: "2,400+ Projects & Counting", description: "Today, Avina Interiors is one of Vizag's most trusted end-to-end interior design studios." },
];

export const values = [
  {
    title: "Transparency",
    description: "Itemised quotes, fixed contracts, and honest timelines — always.",
    icon: "Eye",
  },
  {
    title: "Craftsmanship",
    description: "In-house manufacturing means every joint, hinge and finish meets our own standard.",
    icon: "Hammer",
  },
  {
    title: "Design-Led",
    description: "Every project starts with space planning and 3D visualisation, never guesswork.",
    icon: "PenTool",
  },
  {
    title: "Accountability",
    description: "One dedicated project manager for your entire journey — no vendor juggling.",
    icon: "ShieldCheck",
  },
];
