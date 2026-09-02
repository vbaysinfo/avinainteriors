import type { Badge } from "@/platform/types";

export const badges: Badge[] = [
  { id: "first-lab", name: "First Steps", emoji: "👣", description: "Completed your first interactive lab" },
  { id: "streak-3", name: "On a Roll", emoji: "🔥", description: "3-day practice streak" },
  { id: "streak-7", name: "Unstoppable", emoji: "⚡", description: "7-day practice streak" },
  { id: "science-star", name: "Science Star", emoji: "🧪", description: "Completed 5 Science labs" },
  { id: "maths-whiz", name: "Maths Whiz", emoji: "🧮", description: "Completed 5 Maths labs" },
  { id: "word-wizard", name: "Word Wizard", emoji: "📖", description: "Completed 5 language labs" },
  { id: "perfect-score", name: "Perfectionist", emoji: "🌟", description: "Scored 100% on a quiz" },
  { id: "chapter-champ", name: "Chapter Champion", emoji: "🏆", description: "Finished every lab in a chapter" },
];

export const getBadge = (id: string) => badges.find((b) => b.id === id);
