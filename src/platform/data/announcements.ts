import type { Alert, Announcement } from "@/platform/types";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export const seedAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    schoolId: "sunrise",
    authorId: "t-sunrise-1",
    authorName: "Priya Sharma",
    audience: "class",
    classNum: 6,
    section: "A",
    title: "Acid-Base lab due Friday",
    body: "Please finish the Acid-Base Reaction lab and quiz before Friday's class. Come with questions!",
    createdISO: daysAgo(1),
  },
  {
    id: "ann-2",
    schoolId: "sunrise",
    authorId: "admin-sunrise",
    authorName: "Krishna Murthy (Principal)",
    audience: "school",
    title: "Half-yearly exams from next month",
    body: "Half-yearly exams begin on the 3rd of next month. Teachers, please plan revision labs accordingly.",
    createdISO: daysAgo(2),
  },
  {
    id: "ann-3",
    schoolId: "sunrise",
    authorId: "t-sunrise-5",
    authorName: "Divya Nair",
    audience: "class",
    classNum: 6,
    section: "A",
    title: "Great work on the Water Cycle lab!",
    body: "Most of the class scored full marks on the sequencing lab. Keep it up!",
    createdISO: daysAgo(4),
  },
];

export const seedAlerts: Alert[] = [
  {
    id: "alert-1",
    schoolId: "sunrise",
    severity: "warning",
    title: "Class 8 Science average dropped 12%",
    detail: "Average quiz score fell from 78% to 66% over the last two weeks. Consider a revision lab.",
    createdISO: daysAgo(1),
  },
  {
    id: "alert-2",
    schoolId: "sunrise",
    severity: "critical",
    title: "3 students inactive for 7+ days",
    detail: "Rohan Iyer, Kavya Naidu and Yash Gupta haven't logged in for over a week.",
    createdISO: daysAgo(2),
  },
  {
    id: "alert-3",
    schoolId: "sunrise",
    severity: "info",
    title: "12 assignments awaiting grading",
    detail: "Grading turnaround this week is trending slower than the school average of 2 days.",
    createdISO: daysAgo(0),
  },
  {
    id: "alert-4",
    schoolId: "greenvalley",
    severity: "warning",
    title: "Class 7 Maths completion below 50%",
    detail: "Only 46% of Class 7 has completed the Fractions lab, due tomorrow.",
    createdISO: daysAgo(1),
  },
];
