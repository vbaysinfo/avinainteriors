export type Testimonial = {
  name: string;
  location: string;
  project: string;
  rating: number;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Sandhya & Ravi Teja",
    location: "Rushikonda, Vizag",
    project: "3BHK Apartment Interiors",
    rating: 5,
    quote:
      "Avina Interiors turned our sea-facing apartment into something out of a magazine. The 3D designs matched the final output almost exactly, and they finished 4 days ahead of schedule.",
  },
  {
    name: "Dr. Kiran Kumar",
    location: "MVP Colony, Vizag",
    project: "4BHK Villa",
    rating: 5,
    quote:
      "We interviewed 5 interior firms in Vizag before choosing Avina. Their transparency on costing and the single point of contact made a 3-floor villa project genuinely stress-free.",
  },
  {
    name: "Priyanka Reddy",
    location: "Madhurawada, Vizag",
    project: "Modular Kitchen",
    rating: 5,
    quote:
      "Our kitchen was ready in 21 days exactly as promised. The soft-close drawers and corner carousel have made cooking so much easier. Highly recommend the team.",
  },
  {
    name: "Anil Varma",
    location: "Siripuram, Vizag",
    project: "Corporate Office Fit-out",
    rating: 5,
    quote:
      "They understood our brand and delivered a 6,200 sq.ft office fit-out in 45 days without disrupting our operations. Extremely professional project management.",
  },
  {
    name: "Lakshmi & Suresh",
    location: "Gajuwaka, Vizag",
    project: "2BHK Apartment",
    rating: 5,
    quote:
      "We had a tight budget and an even tighter apartment. The team designed storage we didn't think was possible in our space. Couldn't be happier.",
  },
  {
    name: "Naveen Chowdary",
    location: "Seethammadhara, Vizag",
    project: "Duplex Home",
    rating: 5,
    quote:
      "From the first consultation to the final handover, communication was clear and consistent. Our duplex looks better than we imagined.",
  },
];
