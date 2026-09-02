// Core domain types for D.Interactive, the multi-tenant learning platform.
// Everything here is intentionally serializable (no functions, no class
// instances) because it is persisted to localStorage in this demo build and
// is designed to map 1:1 onto future REST/GraphQL payloads.

export type Role = "super-admin" | "admin" | "teacher" | "student";

export type SubjectName =
  | "Maths"
  | "Science"
  | "English"
  | "Telugu"
  | "Social Studies";

export interface School {
  id: string;
  name: string;
  city: string;
  board: "State Board" | "CBSE" | "ICSE";
  logoEmoji: string;
  colorFrom: string;
  colorTo: string;
  classesOffered: number[]; // e.g. [1..10]
  onboardedOn: string; // ISO date
  status: "active" | "trial" | "suspended";
  studentCount: number;
  teacherCount: number;
}

export interface BaseUser {
  id: string;
  schoolId: string;
  name: string;
  avatarEmoji: string;
  role: Role;
}

export interface StudentUser extends BaseUser {
  role: "student";
  classNum: number; // 1-10
  section: string; // A, B, C
  xp: number;
  streakDays: number;
  lastActiveISO: string;
  badges: string[]; // badge ids
  completedLabIds: string[];
}

export interface TeacherUser extends BaseUser {
  role: "teacher";
  subjects: SubjectName[];
  classesHandled: number[];
}

export interface AdminUser extends BaseUser {
  role: "admin";
}

export interface SuperAdminUser extends BaseUser {
  role: "super-admin";
  schoolId: "platform";
}

export type PlatformUser = StudentUser | TeacherUser | AdminUser | SuperAdminUser;

// ---------------------------------------------------------------------------
// Interactive Lab Engine — the reusable content schema. One engine renders
// every subject's labs by branching on `interactionType`.
// ---------------------------------------------------------------------------

export type InteractionType =
  | "drag-mix"
  | "drag-to-count"
  | "drag-to-match"
  | "drag-to-sequence"
  | "drag-to-label";

export interface LabCombo {
  combo: string[]; // item ids that must be combined/matched (order-insensitive unless noted)
  result: string; // human-readable outcome shown to the student
  detail?: string; // equation / fact / caption revealed on success
  points: number;
}

export interface LabItem {
  id: string;
  label: string;
  emoji: string; // stands in for a real illustration asset
  colorFrom: string;
  colorTo: string;
}

export interface LabSound {
  pickup?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  complete?: boolean;
}

export interface LabContent {
  id: string;
  subject: SubjectName;
  classNum: number;
  topic: string;
  chapter: string;
  interactionType: InteractionType;
  description: string;
  // The scene/container students drag items into (beaker, basket, board...)
  targetLabel: string;
  targetEmoji: string;
  items: LabItem[];
  correctCombos: LabCombo[]; // drag-mix / drag-to-match / drag-to-label
  sequence?: string[]; // drag-to-sequence: correct order of item ids
  countTarget?: number; // drag-to-count: how many to drag in
  hints: { default: string; onWrong?: string };
  xp: number;
  estMinutes: number;
  status: "published" | "draft" | "pending-review";
  source: "manual" | "pdf-generated";
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

// ---------------------------------------------------------------------------
// Assignments, submissions, grading
// ---------------------------------------------------------------------------

export type AssignmentType = "lab" | "quiz" | "written" | "project";
export type AssignmentStatus = "pending" | "submitted" | "graded";

export interface Assignment {
  id: string;
  schoolId: string;
  subject: SubjectName;
  classNum: number;
  section: string;
  title: string;
  type: AssignmentType;
  labId?: string;
  teacherId: string;
  dueDateISO: string;
  createdISO: string;
  maxScore: number;
  instructions: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedISO?: string;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
  attempts: number;
  timeSpentSec: number;
}

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

export interface Announcement {
  id: string;
  schoolId: string;
  authorId: string;
  authorName: string;
  audience: "class" | "school";
  classNum?: number;
  section?: string;
  title: string;
  body: string;
  createdISO: string;
}

export interface DoubtMessage {
  id: string;
  schoolId: string;
  studentId: string;
  teacherId: string;
  subject: SubjectName;
  message: string;
  createdISO: string;
  reply?: string;
  repliedISO?: string;
}

// ---------------------------------------------------------------------------
// Monitoring / alerts
// ---------------------------------------------------------------------------

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  schoolId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  createdISO: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}
