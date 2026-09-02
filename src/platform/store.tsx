"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type {
  Alert,
  Announcement,
  AdminUser,
  Assignment,
  DoubtMessage,
  LabContent,
  PlatformUser,
  Role,
  School,
  StudentUser,
  Submission,
  SubjectName,
  TeacherUser,
} from "@/platform/types";
import { schools as seedSchools } from "@/platform/data/schools";
import {
  admins as seedAdmins,
  students as seedStudents,
  superAdmin,
  teachers as seedTeachers,
} from "@/platform/data/users";
import { labs as seedLabs } from "@/platform/data/labs";
import {
  assignments as seedAssignments,
  buildSeedSubmissions,
} from "@/platform/data/assignments";
import { seedAlerts, seedAnnouncements } from "@/platform/data/announcements";
import { levelFromXp } from "@/platform/lib/gamification";
import { badges as badgeCatalog } from "@/platform/data/badges";

const STORAGE_KEY = "dinteractive.state.v2";

interface Session {
  role: Role;
  userId: string;
}

interface State {
  session: Session | null;
  schools: School[];
  students: StudentUser[];
  teachers: TeacherUser[];
  admins: AdminUser[];
  labs: LabContent[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  doubts: DoubtMessage[];
  alerts: Alert[];
}

function buildInitialState(): State {
  return {
    session: null,
    schools: seedSchools,
    students: seedStudents,
    teachers: seedTeachers,
    admins: seedAdmins,
    labs: seedLabs,
    assignments: seedAssignments,
    submissions: buildSeedSubmissions(),
    announcements: seedAnnouncements,
    doubts: [],
    alerts: seedAlerts,
  };
}

type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "LOGIN"; session: Session }
  | { type: "LOGOUT" }
  | { type: "UPSERT_STUDENT"; student: StudentUser }
  | { type: "UPSERT_TEACHER"; teacher: TeacherUser }
  | { type: "UPSERT_ADMIN"; admin: AdminUser }
  | { type: "ADD_SCHOOL"; school: School }
  | { type: "ADD_STUDENTS_BULK"; students: StudentUser[] }
  | {
      type: "RECORD_LAB_ATTEMPT";
      studentId: string;
      labId: string;
      xpGained: number;
      earnedBadges: string[];
    }
  | {
      type: "UPSERT_SUBMISSION";
      submission: Submission;
    }
  | { type: "CREATE_ASSIGNMENT"; assignment: Assignment }
  | { type: "POST_ANNOUNCEMENT"; announcement: Announcement }
  | { type: "ASK_TEACHER"; doubt: DoubtMessage }
  | { type: "REPLY_DOUBT"; doubtId: string; reply: string }
  | { type: "PUBLISH_LAB"; lab: LabContent }
  | { type: "ADD_LAB_DRAFT"; lab: LabContent }
  | { type: "RESET_DEMO" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "LOGIN":
      return { ...state, session: action.session };
    case "LOGOUT":
      return { ...state, session: null };
    case "UPSERT_STUDENT": {
      const exists = state.students.some((s) => s.id === action.student.id);
      return {
        ...state,
        students: exists
          ? state.students.map((s) => (s.id === action.student.id ? action.student : s))
          : [...state.students, action.student],
      };
    }
    case "UPSERT_TEACHER": {
      const exists = state.teachers.some((t) => t.id === action.teacher.id);
      return {
        ...state,
        teachers: exists
          ? state.teachers.map((t) => (t.id === action.teacher.id ? action.teacher : t))
          : [...state.teachers, action.teacher],
      };
    }
    case "UPSERT_ADMIN": {
      const exists = state.admins.some((a) => a.id === action.admin.id);
      return {
        ...state,
        admins: exists
          ? state.admins.map((a) => (a.id === action.admin.id ? action.admin : a))
          : [...state.admins, action.admin],
      };
    }
    case "ADD_SCHOOL":
      return { ...state, schools: [...state.schools, action.school] };
    case "ADD_STUDENTS_BULK":
      return { ...state, students: [...state.students, ...action.students] };
    case "RECORD_LAB_ATTEMPT": {
      const student = state.students.find((s) => s.id === action.studentId);
      if (!student) return state;
      const newBadges = Array.from(new Set([...student.badges, ...action.earnedBadges]));
      const newCompleted = student.completedLabIds.includes(action.labId)
        ? student.completedLabIds
        : [...student.completedLabIds, action.labId];
      const updated: StudentUser = {
        ...student,
        xp: student.xp + action.xpGained,
        badges: newBadges,
        completedLabIds: newCompleted,
        lastActiveISO: new Date().toISOString(),
      };
      return {
        ...state,
        students: state.students.map((s) => (s.id === updated.id ? updated : s)),
      };
    }
    case "UPSERT_SUBMISSION": {
      const exists = state.submissions.some((s) => s.id === action.submission.id);
      return {
        ...state,
        submissions: exists
          ? state.submissions.map((s) => (s.id === action.submission.id ? action.submission : s))
          : [...state.submissions, action.submission],
      };
    }
    case "CREATE_ASSIGNMENT":
      return { ...state, assignments: [action.assignment, ...state.assignments] };
    case "POST_ANNOUNCEMENT":
      return { ...state, announcements: [action.announcement, ...state.announcements] };
    case "ASK_TEACHER":
      return { ...state, doubts: [action.doubt, ...state.doubts] };
    case "REPLY_DOUBT":
      return {
        ...state,
        doubts: state.doubts.map((d) =>
          d.id === action.doubtId
            ? { ...d, reply: action.reply, repliedISO: new Date().toISOString() }
            : d
        ),
      };
    case "PUBLISH_LAB":
      return {
        ...state,
        labs: state.labs.map((l) => (l.id === action.lab.id ? action.lab : l)),
      };
    case "ADD_LAB_DRAFT":
      return { ...state, labs: [action.lab, ...state.labs] };
    case "RESET_DEMO":
      return buildInitialState();
    default:
      return state;
  }
}

interface Ctx {
  state: State;
  ready: boolean;
  currentUser: PlatformUser | null;
  loginStudent: (input: { name: string; classNum: number; section: string; schoolId: string }) => string;
  loginTeacher: (input: { name: string; subject: SubjectName; schoolId: string }) => string;
  loginAdmin: (input: { name: string; schoolId: string }) => string;
  loginSuperAdmin: () => void;
  logout: () => void;
  recordLabAttempt: (studentId: string, labId: string, xpGained: number, score: number, maxScore: number) => string[];
  submitAssignment: (assignmentId: string, studentId: string, opts?: { score?: number; auto?: boolean }) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  createAssignment: (assignment: Omit<Assignment, "id" | "createdISO" | "dueDateISO"> & { dueInDays: number }) => void;
  postAnnouncement: (announcement: Omit<Announcement, "id" | "createdISO">) => void;
  askTeacher: (doubt: Omit<DoubtMessage, "id" | "createdISO">) => void;
  replyDoubt: (doubtId: string, reply: string) => void;
  publishLab: (lab: LabContent) => void;
  addLabDraft: (lab: LabContent) => void;
  addSchool: (school: Omit<School, "id" | "onboardedOn" | "studentCount" | "teacherCount">) => void;
  addStudentsBulk: (schoolId: string, rows: { name: string; classNum: number; section: string }[]) => void;
  resetDemo: () => void;
}

const PlatformContext = createContext<Ctx | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  // Guards against a real bug: on a hard navigation/refresh, the reducer's
  // initial state has no session yet (localStorage hydration is async, by
  // necessity — it can't run during SSR). Anything that checks `session`
  // before hydration finishes (RoleGuard) must wait for `ready` instead of
  // treating "no session yet" as "logged out" and bouncing to /login.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch {
      // ignore corrupt storage
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return; // don't clobber stored state with the pre-hydration default
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full/unavailable — demo state just won't persist
    }
  }, [state, ready]);

  const currentUser: PlatformUser | null = useMemo(() => {
    if (!state.session) return null;
    const { role, userId } = state.session;
    if (role === "student") return state.students.find((s) => s.id === userId) ?? null;
    if (role === "teacher") return state.teachers.find((t) => t.id === userId) ?? null;
    if (role === "admin") return state.admins.find((a) => a.id === userId) ?? null;
    if (role === "super-admin") return superAdmin;
    return null;
  }, [state.session, state.students, state.teachers, state.admins]);

  const loginStudent = useCallback<Ctx["loginStudent"]>(
    ({ name, classNum, section, schoolId }) => {
      const trimmed = name.trim();
      const existing = state.students.find(
        (s) =>
          s.schoolId === schoolId &&
          s.classNum === classNum &&
          s.section.toLowerCase() === section.toLowerCase() &&
          s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        dispatch({ type: "LOGIN", session: { role: "student", userId: existing.id } });
        return existing.id;
      }
      const id = `stu-${schoolId}-${Date.now()}`;
      const avatarPool = ["🦁", "🐼", "🐯", "🐨", "🦊", "🐸", "🦄", "🐵", "🐰", "🐻"];
      const student: StudentUser = {
        id,
        schoolId,
        name: trimmed || "New Student",
        avatarEmoji: avatarPool[Math.floor(Math.random() * avatarPool.length)],
        role: "student",
        classNum,
        section: section.toUpperCase(),
        xp: 0,
        streakDays: 0,
        lastActiveISO: new Date().toISOString(),
        badges: [],
        completedLabIds: [],
      };
      dispatch({ type: "UPSERT_STUDENT", student });
      dispatch({ type: "LOGIN", session: { role: "student", userId: id } });
      return id;
    },
    [state.students]
  );

  const loginTeacher = useCallback<Ctx["loginTeacher"]>(
    ({ name, subject, schoolId }) => {
      const trimmed = name.trim();
      const existing = state.teachers.find(
        (t) => t.schoolId === schoolId && t.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        dispatch({ type: "LOGIN", session: { role: "teacher", userId: existing.id } });
        return existing.id;
      }
      const id = `t-${schoolId}-${Date.now()}`;
      const teacher: TeacherUser = {
        id,
        schoolId,
        name: trimmed || "New Teacher",
        avatarEmoji: "👩‍🏫",
        role: "teacher",
        subjects: [subject],
        classesHandled: [6],
      };
      dispatch({ type: "UPSERT_TEACHER", teacher });
      dispatch({ type: "LOGIN", session: { role: "teacher", userId: id } });
      return id;
    },
    [state.teachers]
  );

  const loginAdmin = useCallback<Ctx["loginAdmin"]>(
    ({ name, schoolId }) => {
      const trimmed = name.trim();
      const existing = state.admins.find((a) => a.schoolId === schoolId);
      if (existing) {
        const updated = trimmed ? { ...existing, name: trimmed } : existing;
        dispatch({ type: "UPSERT_ADMIN", admin: updated });
        dispatch({ type: "LOGIN", session: { role: "admin", userId: updated.id } });
        return updated.id;
      }
      const id = `admin-${schoolId}-${Date.now()}`;
      const admin: AdminUser = {
        id,
        schoolId,
        name: trimmed || "New Admin",
        avatarEmoji: "🎓",
        role: "admin",
      };
      dispatch({ type: "UPSERT_ADMIN", admin });
      dispatch({ type: "LOGIN", session: { role: "admin", userId: id } });
      return id;
    },
    [state.admins]
  );

  const loginSuperAdmin = useCallback(() => {
    dispatch({ type: "LOGIN", session: { role: "super-admin", userId: superAdmin.id } });
  }, []);

  const logout = useCallback(() => dispatch({ type: "LOGOUT" }), []);

  const recordLabAttempt = useCallback<Ctx["recordLabAttempt"]>(
    (studentId, labId, xpGained, score, maxScore) => {
      const student = state.students.find((s) => s.id === studentId);
      const lab = state.labs.find((l) => l.id === labId);
      const earned: string[] = [];
      if (student) {
        const alreadyHasFirst = student.badges.includes("first-lab");
        if (!alreadyHasFirst) earned.push("first-lab");
        if (score === maxScore && maxScore > 0 && !student.badges.includes("perfect-score")) {
          earned.push("perfect-score");
        }
        const { level: newLevel } = levelFromXp(student.xp + xpGained);
        const { level: oldLevel } = levelFromXp(student.xp);
        if (lab?.subject === "Science" && !student.badges.includes("science-star") && newLevel > oldLevel) {
          earned.push("science-star");
        }
      }
      dispatch({ type: "RECORD_LAB_ATTEMPT", studentId, labId, xpGained, earnedBadges: earned });
      return earned;
    },
    [state.students, state.labs]
  );

  const submitAssignment = useCallback<Ctx["submitAssignment"]>((assignmentId, studentId, opts) => {
    const id = `sub-${assignmentId}-${studentId}`;
    const submission: Submission = {
      id,
      assignmentId,
      studentId,
      submittedISO: new Date().toISOString(),
      status: opts?.auto ? "graded" : "submitted",
      score: opts?.score,
      attempts: 1,
      timeSpentSec: 0,
    };
    dispatch({ type: "UPSERT_SUBMISSION", submission });
  }, []);

  const gradeSubmission = useCallback<Ctx["gradeSubmission"]>((submissionId, score, feedback) => {
    const existing = state.submissions.find((s) => s.id === submissionId);
    if (!existing) return;
    dispatch({
      type: "UPSERT_SUBMISSION",
      submission: { ...existing, status: "graded", score, feedback },
    });
  }, [state.submissions]);

  const createAssignment = useCallback<Ctx["createAssignment"]>(({ dueInDays, ...assignment }) => {
    const now = Date.now();
    dispatch({
      type: "CREATE_ASSIGNMENT",
      assignment: {
        ...assignment,
        id: `asg-${now}`,
        createdISO: new Date(now).toISOString(),
        dueDateISO: new Date(now + dueInDays * 86400000).toISOString(),
      },
    });
  }, []);

  const postAnnouncement = useCallback<Ctx["postAnnouncement"]>((announcement) => {
    dispatch({
      type: "POST_ANNOUNCEMENT",
      announcement: { ...announcement, id: `ann-${Date.now()}`, createdISO: new Date().toISOString() },
    });
  }, []);

  const askTeacher = useCallback<Ctx["askTeacher"]>((doubt) => {
    dispatch({
      type: "ASK_TEACHER",
      doubt: { ...doubt, id: `doubt-${Date.now()}`, createdISO: new Date().toISOString() },
    });
  }, []);

  const replyDoubt = useCallback<Ctx["replyDoubt"]>((doubtId, reply) => {
    dispatch({ type: "REPLY_DOUBT", doubtId, reply });
  }, []);

  const publishLab = useCallback<Ctx["publishLab"]>((lab) => {
    dispatch({ type: "PUBLISH_LAB", lab });
  }, []);

  const addLabDraft = useCallback<Ctx["addLabDraft"]>((lab) => {
    dispatch({ type: "ADD_LAB_DRAFT", lab });
  }, []);

  const addSchool = useCallback<Ctx["addSchool"]>((school) => {
    dispatch({
      type: "ADD_SCHOOL",
      school: {
        ...school,
        id: `school-${Date.now()}`,
        onboardedOn: new Date().toISOString(),
        studentCount: 0,
        teacherCount: 0,
      },
    });
  }, []);

  const addStudentsBulk = useCallback<Ctx["addStudentsBulk"]>((schoolId, rows) => {
    const avatarPool = ["🦁", "🐼", "🐯", "🐨", "🦊", "🐸", "🦄", "🐵", "🐰", "🐻"];
    const created: StudentUser[] = rows.map((row, i) => ({
      id: `stu-${schoolId}-bulk-${Date.now()}-${i}`,
      schoolId,
      name: row.name,
      avatarEmoji: avatarPool[i % avatarPool.length],
      role: "student",
      classNum: row.classNum,
      section: row.section.toUpperCase(),
      xp: 0,
      streakDays: 0,
      lastActiveISO: new Date().toISOString(),
      badges: [],
      completedLabIds: [],
    }));
    dispatch({ type: "ADD_STUDENTS_BULK", students: created });
  }, []);

  const resetDemo = useCallback(() => dispatch({ type: "RESET_DEMO" }), []);

  const value: Ctx = {
    state,
    ready,
    currentUser,
    loginStudent,
    loginTeacher,
    loginAdmin,
    loginSuperAdmin,
    logout,
    recordLabAttempt,
    submitAssignment,
    gradeSubmission,
    createAssignment,
    postAnnouncement,
    askTeacher,
    replyDoubt,
    publishLab,
    addLabDraft,
    addSchool,
    addStudentsBulk,
    resetDemo,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}

export function getAllBadges() {
  return badgeCatalog;
}
