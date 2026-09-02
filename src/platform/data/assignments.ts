import type { Assignment, Submission } from "@/platform/types";
import { students, teachers } from "@/platform/data/users";
import { labs } from "@/platform/data/labs";

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

const sciTeacher = teachers.find((t) => t.id === "t-sunrise-1")!;
const mathTeacher = teachers.find((t) => t.id === "t-sunrise-2")!;
const engTeacher = teachers.find((t) => t.id === "t-sunrise-3")!;
const teluguTeacher = teachers.find((t) => t.id === "t-sunrise-4")!;
const ssTeacher = teachers.find((t) => t.id === "t-sunrise-5")!;

export const assignments: Assignment[] = [
  {
    id: "asg-1",
    schoolId: "sunrise",
    subject: "Science",
    classNum: 6,
    section: "A",
    title: "Acid-Base Reaction Lab",
    type: "lab",
    labId: "sci-acid-base",
    teacherId: sciTeacher.id,
    dueDateISO: daysFromNow(3),
    createdISO: daysFromNow(-4),
    maxScore: 60,
    instructions: "Complete the Acid-Base Reaction lab and score at least 40 points before the quiz auto-submits.",
  },
  {
    id: "asg-2",
    schoolId: "sunrise",
    subject: "Maths",
    classNum: 6,
    section: "A",
    title: "Fractions — Written Practice",
    type: "written",
    teacherId: mathTeacher.id,
    dueDateISO: daysFromNow(-1),
    createdISO: daysFromNow(-6),
    maxScore: 20,
    instructions: "Solve questions 1–10 from the workbook page 34 and upload a photo of your work.",
  },
  {
    id: "asg-3",
    schoolId: "sunrise",
    subject: "English",
    classNum: 6,
    section: "A",
    title: "Grammar Quiz — Parts of Speech",
    type: "quiz",
    teacherId: engTeacher.id,
    dueDateISO: daysFromNow(5),
    createdISO: daysFromNow(-1),
    maxScore: 10,
    instructions: "10 quick questions on nouns, verbs and adjectives.",
  },
  {
    id: "asg-4",
    schoolId: "sunrise",
    subject: "Social Studies",
    classNum: 6,
    section: "A",
    title: "Water Cycle Lab",
    type: "lab",
    labId: "ss-water-cycle",
    teacherId: ssTeacher.id,
    dueDateISO: daysFromNow(2),
    createdISO: daysFromNow(-2),
    maxScore: 40,
    instructions: "Sequence the water cycle correctly and pass the mini quiz.",
  },
  {
    id: "asg-5",
    schoolId: "sunrise",
    subject: "Telugu",
    classNum: 6,
    section: "A",
    title: "వ్యాసం — Short Essay Project",
    type: "project",
    teacherId: teluguTeacher.id,
    dueDateISO: daysFromNow(10),
    createdISO: daysFromNow(-3),
    maxScore: 25,
    instructions: "మా గ్రామం (My Village) అనే అంశంపై 150 పదాలలో వ్యాసం రాయండి.",
  },
];

// Deterministic pseudo-random submissions so dashboards have realistic,
// stable-looking data across reloads without a real backend.
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 1000) / 1000;
  };
}

export function buildSeedSubmissions(): Submission[] {
  const out: Submission[] = [];
  const classStudents = students.filter((s) => s.schoolId === "sunrise" && s.classNum === 6);
  let seed = 7;
  for (const assignment of assignments) {
    if (assignment.schoolId !== "sunrise" || assignment.classNum !== 6) continue;
    for (const student of classStudents) {
      seed += 1;
      const rand = seededRand(seed * 31 + assignment.id.length);
      const roll = rand();
      let status: Submission["status"] = "pending";
      let score: number | undefined;
      let submittedISO: string | undefined;
      if (roll < 0.55) {
        status = "graded";
        score = Math.round(assignment.maxScore * (0.55 + rand() * 0.45));
        submittedISO = daysFromNow(-Math.floor(rand() * 4) - 1);
      } else if (roll < 0.8) {
        status = "submitted";
        submittedISO = daysFromNow(-Math.floor(rand() * 2));
      }
      out.push({
        id: `sub-${assignment.id}-${student.id}`,
        assignmentId: assignment.id,
        studentId: student.id,
        status,
        score,
        submittedISO,
        attempts: status === "pending" ? 0 : 1 + Math.floor(rand() * 3),
        timeSpentSec: status === "pending" ? 0 : 120 + Math.floor(rand() * 600),
      });
    }
  }
  return out;
}

export const labById = Object.fromEntries(labs.map((l) => [l.id, l]));
