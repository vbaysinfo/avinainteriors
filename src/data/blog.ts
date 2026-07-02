export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  date: string;
  readTime: string;
  category: string;
  tone: "gold" | "forest" | "terracotta" | "ink" | "sand";
};

export const blogPosts: BlogPost[] = [
  {
    slug: "interior-design-cost-guide-visakhapatnam",
    title: "Interior Design Cost Guide for Visakhapatnam Homes (2026)",
    excerpt:
      "A transparent breakdown of what full-home interiors, modular kitchens and wardrobes actually cost in Vizag — so you can budget with confidence.",
    date: "2026-05-12",
    readTime: "7 min read",
    category: "Budgeting",
    tone: "gold",
    content: [
      "One of the most common questions we get from homeowners across Visakhapatnam is: 'What will my interiors actually cost?' The honest answer is that it depends on carpet area, material choices and the scope of civil work — but here's a transparent starting-point breakdown.",
      "For a standard 2BHK apartment (900–1100 sq.ft) in areas like Madhurawada or Gajuwaka, full-home interiors typically range between ₹9–14 lakhs depending on whether you choose laminate or veneer finishes. A 3BHK in Rushikonda or MVP Colony usually falls between ₹16–24 lakhs.",
      "Modular kitchens are priced by running feet and layout — a straight-line kitchen starts around ₹1.2 lakhs, while an island or U-shaped layout with premium hardware can go up to ₹4-5 lakhs.",
      "The biggest cost variable is material grade: BWP-grade marine plywood vs. MDF, laminate vs. acrylic/PU finishes, and the hardware brand (Hettich/Hafele vs. local alternatives) can shift your budget by 20-30%.",
      "Our recommendation: always ask for an itemised quote broken down by carpentry, civil work, electrical, false ceiling and furnishing — not a single lump-sum number. That's exactly how we quote every Avina Interiors project.",
    ],
  },
  {
    slug: "modular-kitchen-layouts-small-apartments",
    title: "5 Modular Kitchen Layouts That Work Best for Small Vizag Apartments",
    excerpt:
      "Compact doesn't mean cramped. Here are the five layouts our designers reach for most often in 80-150 sq.ft kitchens.",
    date: "2026-04-02",
    readTime: "5 min read",
    category: "Kitchens",
    tone: "terracotta",
    content: [
      "Most apartment kitchens in Vizag's newer high-rises fall between 80-150 sq.ft — tight, but far from limiting if the layout is right.",
      "1. Parallel (galley) layout: our most-used layout for narrow kitchens, giving two full runs of counter and storage directly opposite each other.",
      "2. L-shaped with breakfast counter: ideal when the kitchen opens into a dining or living area, letting one arm double as a casual seating counter.",
      "3. Single-wall with tall units: best for very compact utility-style kitchens, maximising vertical storage with tall pull-out units.",
      "4. U-shaped compact: works when the kitchen is squarish, wrapping storage on three sides for maximum counter space.",
      "5. Island-lite (peninsula): a scaled-down island that works even in mid-sized kitchens by using an peninsula counter instead of a freestanding island.",
      "Whatever the layout, we always prioritise the 'kitchen work triangle' — sink, hob and refrigerator positioned for minimum movement.",
    ],
  },
  {
    slug: "false-ceiling-lighting-trends-2026",
    title: "False Ceiling & Lighting Trends We're Designing in 2026",
    excerpt:
      "From cove lighting to statement pendants — the lighting design choices defining premium Vizag homes this year.",
    date: "2026-02-18",
    readTime: "6 min read",
    category: "Design Trends",
    tone: "ink",
    content: [
      "Lighting design has become one of the highest-impact, most requested elements in our recent projects across Visakhapatnam.",
      "Cove lighting along false ceiling perimeters continues to be the most requested feature for living rooms and bedrooms — it creates a soft, ambient glow without harsh downlighting.",
      "Layered lighting — combining ambient, task and accent light sources — is replacing single ceiling-light setups even in mid-sized homes.",
      "Statement pendant lights over dining tables and kitchen islands are having a moment, often paired with minimal, unobtrusive false ceilings elsewhere.",
      "Smart, app-controlled lighting scenes (morning, relax, movie night) are increasingly requested even in budget-conscious projects thanks to falling hardware costs.",
    ],
  },
  {
    slug: "choosing-an-interior-designer-in-vizag",
    title: "7 Questions to Ask Before Hiring an Interior Designer in Vizag",
    excerpt:
      "Protect your budget and timeline by asking these questions before signing with any interior design firm.",
    date: "2026-01-22",
    readTime: "8 min read",
    category: "Guides",
    tone: "forest",
    content: [
      "Hiring the right interior design partner is as important as the design itself. Here are seven questions we always encourage homeowners to ask — including us.",
      "1. Is the quote itemised or a lump sum? Always ask for a line-by-line breakdown of carpentry, civil, electrical and furnishing costs.",
      "2. What warranty do you offer on modular furniture? Look for at least 5-10 years on hinges, shutters and core material.",
      "3. Do you manufacture in-house or outsource? In-house production usually means better quality control and faster resolution of defects.",
      "4. What happens if there's a delay? A credible firm will have a penalty clause or compensation policy for missed timelines.",
      "5. Can I see 3D designs before work begins? This should be non-negotiable for any project above ₹5 lakhs.",
      "6. Can I speak to 2-3 recent clients? A firm confident in its work will happily share references.",
      "7. Who is my single point of contact? You shouldn't have to coordinate separately with carpenters, electricians and painters.",
    ],
  },
];

export const getPostBySlug = (slug: string) =>
  blogPosts.find((p) => p.slug === slug);
