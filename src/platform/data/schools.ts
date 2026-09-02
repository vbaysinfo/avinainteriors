import type { School } from "@/platform/types";

export const schools: School[] = [
  {
    id: "sunrise",
    name: "Sunrise Public School",
    city: "Visakhapatnam, AP",
    board: "State Board",
    logoEmoji: "🌅",
    colorFrom: "#6d5bfa",
    colorTo: "#14b8a6",
    classesOffered: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    onboardedOn: "2024-06-01",
    status: "active",
    studentCount: 640,
    teacherCount: 38,
  },
  {
    id: "greenvalley",
    name: "Green Valley High School",
    city: "Hyderabad, TS",
    board: "CBSE",
    logoEmoji: "🌿",
    colorFrom: "#ff9f43",
    colorTo: "#ff6b9d",
    classesOffered: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    onboardedOn: "2025-01-15",
    status: "active",
    studentCount: 410,
    teacherCount: 26,
  },
  {
    id: "riverdale",
    name: "Riverdale English Medium School",
    city: "Vijayawada, AP",
    board: "ICSE",
    logoEmoji: "📘",
    colorFrom: "#22c55e",
    colorTo: "#6d5bfa",
    classesOffered: [1, 2, 3, 4, 5, 6, 7, 8],
    onboardedOn: "2025-11-02",
    status: "trial",
    studentCount: 95,
    teacherCount: 9,
  },
];

export const getSchool = (id: string) => schools.find((s) => s.id === id);
