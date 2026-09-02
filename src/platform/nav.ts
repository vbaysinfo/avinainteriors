import type { Role } from "@/platform/types";

export interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

export const navByRole: Record<Role, NavItem[]> = {
  student: [
    { href: "/platform/student", label: "Overview", emoji: "🏠" },
    { href: "/platform/student/labs", label: "Interactive Labs", emoji: "🧪" },
    { href: "/platform/student/assignments", label: "Assignments", emoji: "📝" },
    { href: "/platform/student/progress", label: "Progress", emoji: "📈" },
    { href: "/platform/student/ask-teacher", label: "Ask Teacher", emoji: "💬" },
  ],
  teacher: [
    { href: "/platform/teacher", label: "Overview", emoji: "🏠" },
    { href: "/platform/teacher/assignments", label: "Assignments", emoji: "📝" },
    { href: "/platform/teacher/performance", label: "Student Performance", emoji: "📊" },
    { href: "/platform/teacher/announcements", label: "Announcements", emoji: "📣" },
    { href: "/platform/teacher/content-pipeline", label: "Content Pipeline", emoji: "📄" },
  ],
  admin: [
    { href: "/platform/admin", label: "Overview", emoji: "🏠" },
    { href: "/platform/admin/teachers", label: "Teachers", emoji: "👩‍🏫" },
    { href: "/platform/admin/students", label: "Students", emoji: "🎒" },
    { href: "/platform/admin/alerts", label: "Alerts", emoji: "🚨" },
    { href: "/platform/admin/reports", label: "Reports", emoji: "📑" },
  ],
  "super-admin": [
    { href: "/platform/super-admin", label: "Overview", emoji: "🏠" },
    { href: "/platform/super-admin/schools", label: "Schools", emoji: "🏫" },
  ],
};

export const roleLabel: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Principal / Admin",
  "super-admin": "Super Admin",
};
