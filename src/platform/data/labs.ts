import type { LabContent } from "@/platform/types";

// Every lab below is expressed in the single reusable schema described in
// the product spec. The same LabEngine component renders all of them —
// nothing here is subject-specific UI, only subject-specific *data*. This
// is exactly the shape a PDF-ingestion pipeline (see /platform/teacher's
// "Content Pipeline" tab) would produce automatically per topic.

export const labs: LabContent[] = [
  {
    id: "sci-acid-base",
    subject: "Science",
    classNum: 7,
    chapter: "Acids, Bases and Salts",
    topic: "Acid-Base Reactions",
    interactionType: "drag-mix",
    description:
      "Drag two bottles into the beaker and see what happens. Discover how acids, bases and indicators react.",
    targetLabel: "Beaker",
    targetEmoji: "🧪",
    items: [
      { id: "hcl", label: "HCl (Acid)", emoji: "🧫", colorFrom: "#fca5a5", colorTo: "#ef4444" },
      { id: "naoh", label: "NaOH (Base)", emoji: "🧴", colorFrom: "#93c5fd", colorTo: "#3b82f6" },
      { id: "litmus", label: "Blue Litmus", emoji: "🧻", colorFrom: "#a5b4fc", colorTo: "#6366f1" },
      { id: "water", label: "Water", emoji: "💧", colorFrom: "#7dd3fc", colorTo: "#0ea5e9" },
    ],
    correctCombos: [
      { combo: ["hcl", "naoh"], result: "Neutralization! Clear salt water forms.", detail: "HCl + NaOH → NaCl + H₂O", points: 15 },
      { combo: ["hcl", "litmus"], result: "The litmus turns red — it's acidic!", detail: "Acids turn blue litmus red", points: 10 },
      { combo: ["naoh", "litmus"], result: "The litmus stays blue — it's basic!", detail: "Bases keep litmus blue", points: 10 },
      { combo: ["hcl", "water"], result: "The acid dilutes safely.", detail: "Diluting an acid lowers its concentration", points: 10 },
    ],
    hints: { default: "Try combining an acid with a base, or test with litmus paper.", onWrong: "Hmm, nothing happens with that pair yet — try a different combo!" },
    xp: 60,
    estMinutes: 8,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "What color does blue litmus paper turn in an acid?",
        options: ["Red", "Green", "Stays blue", "Yellow"],
        correctIndex: 0,
      },
      {
        id: "q2",
        question: "HCl + NaOH is an example of a:",
        options: ["Combustion reaction", "Neutralization reaction", "Decomposition reaction", "None of these"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "sci-plant-parts",
    subject: "Science",
    classNum: 4,
    chapter: "Plants Around Us",
    topic: "Parts of a Plant",
    interactionType: "drag-to-label",
    description:
      "Drag each label onto the correct part of the plant diagram to learn what every part does.",
    targetLabel: "Plant Diagram",
    targetEmoji: "🌻",
    items: [
      { id: "root", label: "Root", emoji: "🪴", colorFrom: "#d6a97a", colorTo: "#8b5a2b" },
      { id: "stem", label: "Stem", emoji: "🌱", colorFrom: "#86efac", colorTo: "#16a34a" },
      { id: "leaf", label: "Leaf", emoji: "🍃", colorFrom: "#4ade80", colorTo: "#15803d" },
      { id: "flower", label: "Flower", emoji: "🌸", colorFrom: "#f9a8d4", colorTo: "#db2777" },
    ],
    correctCombos: [
      { combo: ["root", "zone-root"], result: "Roots anchor the plant and absorb water!", points: 10 },
      { combo: ["stem", "zone-stem"], result: "The stem carries water and holds the plant up!", points: 10 },
      { combo: ["leaf", "zone-leaf"], result: "Leaves make food using sunlight!", points: 10 },
      { combo: ["flower", "zone-flower"], result: "Flowers help the plant reproduce!", points: 10 },
    ],
    hints: { default: "Roots grow underground, flowers bloom on top — match by position!", onWrong: "Not quite the right spot — look at where that part actually grows." },
    xp: 40,
    estMinutes: 6,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "Which part of the plant absorbs water from the soil?",
        options: ["Flower", "Leaf", "Root", "Stem"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "maths-counting",
    subject: "Maths",
    classNum: 2,
    chapter: "Numbers up to 20",
    topic: "Counting & Grouping",
    interactionType: "drag-to-count",
    description: "Drag apples into the basket. Watch the number grow as you count together!",
    targetLabel: "Basket",
    targetEmoji: "🧺",
    items: [{ id: "apple", label: "Apple", emoji: "🍎", colorFrom: "#fca5a5", colorTo: "#dc2626" }],
    correctCombos: [],
    countTarget: 7,
    hints: { default: "Drag one apple at a time into the basket and count out loud!" },
    xp: 30,
    estMinutes: 4,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "How many apples did you count into the basket?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "eng-phonics-match",
    subject: "English",
    classNum: 1,
    chapter: "Phonics & Vocabulary",
    topic: "Match the Word to the Picture",
    interactionType: "drag-to-match",
    description: "Drag each word onto the picture it describes.",
    targetLabel: "Picture Cards",
    targetEmoji: "🖼️",
    items: [
      { id: "w-cat", label: "CAT", emoji: "🐱", colorFrom: "#fdba74", colorTo: "#ea580c" },
      { id: "w-sun", label: "SUN", emoji: "☀️", colorFrom: "#fde68a", colorTo: "#f59e0b" },
      { id: "w-ball", label: "BALL", emoji: "⚽", colorFrom: "#93c5fd", colorTo: "#2563eb" },
      { id: "w-fish", label: "FISH", emoji: "🐟", colorFrom: "#67e8f9", colorTo: "#0891b2" },
    ],
    correctCombos: [
      { combo: ["w-cat", "pic-w-cat"], result: "CAT — meow!", points: 10 },
      { combo: ["w-sun", "pic-w-sun"], result: "SUN — shining bright!", points: 10 },
      { combo: ["w-ball", "pic-w-ball"], result: "BALL — let's play!", points: 10 },
      { combo: ["w-fish", "pic-w-fish"], result: "FISH — swimming away!", points: 10 },
    ],
    hints: { default: "Say the word out loud and look for the matching picture!" },
    xp: 30,
    estMinutes: 5,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "Which word matches 🐟?",
        options: ["CAT", "SUN", "BALL", "FISH"],
        correctIndex: 3,
      },
    ],
  },
  {
    id: "tel-letter-match",
    subject: "Telugu",
    classNum: 2,
    chapter: "అక్షరమాల (Alphabet)",
    topic: "అక్షరాలు — Letter to Picture Match",
    interactionType: "drag-to-match",
    description: "బొమ్మకు సరిపోయే అక్షరాన్ని లాగండి — Drag the Telugu letter to the picture it starts with.",
    targetLabel: "బొమ్మలు (Pictures)",
    targetEmoji: "🖼️",
    items: [
      { id: "l-amma", label: "అ — అమ్మ", emoji: "👩", colorFrom: "#fbcfe8", colorTo: "#db2777" },
      { id: "l-illu", label: "ఇ — ఇల్లు", emoji: "🏠", colorFrom: "#bbf7d0", colorTo: "#16a34a" },
      { id: "l-eluka", label: "ఎ — ఎలుక", emoji: "🐭", colorFrom: "#e5e7eb", colorTo: "#6b7280" },
      { id: "l-owl", label: "గ — గుడ్లగూబ", emoji: "🦉", colorFrom: "#fde68a", colorTo: "#b45309" },
    ],
    correctCombos: [
      { combo: ["l-amma", "pic-l-amma"], result: "అ — అమ్మ (Mother)!", points: 10 },
      { combo: ["l-illu", "pic-l-illu"], result: "ఇ — ఇల్లు (House)!", points: 10 },
      { combo: ["l-eluka", "pic-l-eluka"], result: "ఎ — ఎలుక (Mouse)!", points: 10 },
      { combo: ["l-owl", "pic-l-owl"], result: "గ — గుడ్లగూబ (Owl)!", points: 10 },
    ],
    hints: { default: "పదాన్ని బిగ్గరగా చదవండి — say the word out loud, then find its picture!" },
    xp: 30,
    estMinutes: 5,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "'ఇల్లు' means:",
        options: ["Mother", "House", "Mouse", "Owl"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "ss-water-cycle",
    subject: "Social Studies",
    classNum: 5,
    chapter: "Our Environment",
    topic: "The Water Cycle",
    interactionType: "drag-to-sequence",
    description: "Drag the four cards into the correct order to build the water cycle.",
    targetLabel: "Timeline",
    targetEmoji: "🔁",
    items: [
      { id: "evaporation", label: "Evaporation", emoji: "☀️", colorFrom: "#fde68a", colorTo: "#f59e0b" },
      { id: "condensation", label: "Condensation", emoji: "☁️", colorFrom: "#e5e7eb", colorTo: "#9ca3af" },
      { id: "precipitation", label: "Precipitation", emoji: "🌧️", colorFrom: "#93c5fd", colorTo: "#2563eb" },
      { id: "collection", label: "Collection", emoji: "🌊", colorFrom: "#67e8f9", colorTo: "#0891b2" },
    ],
    correctCombos: [],
    sequence: ["evaporation", "condensation", "precipitation", "collection"],
    hints: { default: "Think about what happens to water first: the sun heats it up..." },
    xp: 40,
    estMinutes: 6,
    status: "published",
    source: "manual",
    quiz: [
      {
        id: "q1",
        question: "What happens right after condensation?",
        options: ["Evaporation", "Precipitation", "Collection", "Nothing"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "ss-india-states-pending",
    subject: "Social Studies",
    classNum: 6,
    chapter: "Indian Geography",
    topic: "States & Capitals",
    interactionType: "drag-to-match",
    description: "Auto-generated from Chapter 3 of the uploaded Social Studies textbook. Awaiting teacher review.",
    targetLabel: "Map",
    targetEmoji: "🗺️",
    items: [
      { id: "ap", label: "Andhra Pradesh", emoji: "📍", colorFrom: "#93c5fd", colorTo: "#2563eb" },
      { id: "ts", label: "Telangana", emoji: "📍", colorFrom: "#fca5a5", colorTo: "#dc2626" },
      { id: "tn", label: "Tamil Nadu", emoji: "📍", colorFrom: "#86efac", colorTo: "#16a34a" },
    ],
    correctCombos: [
      { combo: ["ap", "pic-ap"], result: "Andhra Pradesh → Amaravati", points: 10 },
      { combo: ["ts", "pic-ts"], result: "Telangana → Hyderabad", points: 10 },
      { combo: ["tn", "pic-tn"], result: "Tamil Nadu → Chennai", points: 10 },
    ],
    hints: { default: "Match each state to its capital city." },
    xp: 30,
    estMinutes: 5,
    status: "pending-review",
    source: "pdf-generated",
    quiz: [
      {
        id: "q1",
        question: "What is the capital of Telangana?",
        options: ["Amaravati", "Hyderabad", "Chennai", "Vijayawada"],
        correctIndex: 1,
      },
    ],
  },
];

export const getLab = (id: string) => labs.find((l) => l.id === id);
export const labsForClass = (classNum: number, subject?: string) =>
  labs.filter(
    (l) =>
      l.classNum === classNum &&
      l.status === "published" &&
      (!subject || l.subject === subject)
  );
export const subjects: string[] = ["Maths", "Science", "English", "Telugu", "Social Studies"];
