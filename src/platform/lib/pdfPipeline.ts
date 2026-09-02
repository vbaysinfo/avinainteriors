import type { InteractionType, LabContent, LabItem, SubjectName } from "@/platform/types";

// This simulates Module 6 — Content Ingestion Engine (PDF → Interactive
// Lab). A real implementation would run PDF/OCR text+image extraction and
// an LLM concept-extraction pass server-side; here we deterministically
// synthesize a plausible lab draft from the topic the teacher types in, so
// the "upload → auto-generate → teacher review → publish" flow can be
// demoed end-to-end without any external API keys.

export const pipelineSteps = [
  "Extracting text & images from PDF (OCR fallback for scanned pages)…",
  "Segmenting into chapters & topics…",
  "Identifying key concepts, vocabulary & facts…",
  "Selecting best-fit interaction type from the library…",
  "Generating items, images cues, sound cues & quiz…",
];

const suggestedInteraction: Record<SubjectName, InteractionType[]> = {
  Science: ["drag-mix", "drag-to-label", "drag-to-match"],
  Maths: ["drag-to-count", "drag-to-sequence"],
  English: ["drag-to-match", "drag-to-sequence"],
  Telugu: ["drag-to-match"],
  "Social Studies": ["drag-to-sequence", "drag-to-match"],
};

const itemBank: Record<SubjectName, { label: string; emoji: string }[]> = {
  Science: [
    { label: "Oxygen", emoji: "🫧" },
    { label: "Carbon Dioxide", emoji: "💨" },
    { label: "Sunlight", emoji: "☀️" },
    { label: "Chlorophyll", emoji: "🍃" },
  ],
  Maths: [
    { label: "One", emoji: "1️⃣" },
    { label: "Two", emoji: "2️⃣" },
    { label: "Three", emoji: "3️⃣" },
    { label: "Four", emoji: "4️⃣" },
  ],
  English: [
    { label: "Noun", emoji: "📦" },
    { label: "Verb", emoji: "🏃" },
    { label: "Adjective", emoji: "🎨" },
    { label: "Pronoun", emoji: "🙋" },
  ],
  Telugu: [
    { label: "అ", emoji: "🅰️" },
    { label: "ఆ", emoji: "🅱️" },
    { label: "ఇ", emoji: "🔤" },
    { label: "ఈ", emoji: "📝" },
  ],
  "Social Studies": [
    { label: "1857 — Revolt", emoji: "⚔️" },
    { label: "1947 — Independence", emoji: "🇮🇳" },
    { label: "1950 — Republic", emoji: "📜" },
    { label: "1991 — Reforms", emoji: "📈" },
  ],
};

const palette: [string, string][] = [
  ["#93c5fd", "#2563eb"],
  ["#fca5a5", "#dc2626"],
  ["#86efac", "#16a34a"],
  ["#fde68a", "#f59e0b"],
];

export function generateMockLab(input: {
  subject: SubjectName;
  classNum: number;
  topic: string;
  chapter: string;
  sourceFileName?: string;
}): LabContent {
  const interactionType = suggestedInteraction[input.subject][0];
  const bank = itemBank[input.subject];
  const items: LabItem[] = bank.map((b, i) => ({
    id: `gen-${i}-${Date.now()}`,
    label: b.label,
    emoji: b.emoji,
    colorFrom: palette[i % palette.length][0],
    colorTo: palette[i % palette.length][1],
  }));

  const base = {
    id: `pdf-${Date.now()}`,
    subject: input.subject,
    classNum: input.classNum,
    chapter: input.chapter || "Untitled Chapter",
    topic: input.topic || "Untitled Topic",
    description: `Auto-generated from ${input.sourceFileName ?? "the uploaded textbook PDF"}. Review and edit before publishing.`,
    targetEmoji: bank[0].emoji,
    hints: { default: "Look carefully at each item before deciding where it goes." },
    xp: 30,
    estMinutes: 5,
    status: "pending-review" as const,
    source: "pdf-generated" as const,
    quiz: [
      {
        id: "q1",
        question: `What is ${items[0].label} most closely related to in "${input.topic}"?`,
        options: items.map((i) => i.label),
        correctIndex: 0,
      },
    ],
  };

  if (interactionType === "drag-to-sequence") {
    return {
      ...base,
      interactionType,
      targetLabel: "Timeline",
      items,
      correctCombos: [],
      sequence: items.map((i) => i.id),
    };
  }

  if (interactionType === "drag-to-count") {
    return {
      ...base,
      interactionType,
      targetLabel: "Basket",
      items: [items[0]],
      correctCombos: [],
      countTarget: 6,
    };
  }

  if (interactionType === "drag-mix") {
    return {
      ...base,
      interactionType,
      targetLabel: "Beaker",
      items,
      correctCombos: [
        { combo: [items[0].id, items[1].id], result: `${items[0].label} + ${items[1].label} react!`, points: 15 },
      ],
    };
  }

  // drag-to-match / drag-to-label
  return {
    ...base,
    interactionType,
    targetLabel: "Match the Cards",
    items,
    correctCombos: items.map((i) => ({
      combo: [i.id, `pic-${i.id}`],
      result: `${i.label} — correct!`,
      points: 10,
    })),
  };
}
