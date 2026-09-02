"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { Role, SubjectName } from "@/platform/types";
import { usePlatform } from "@/platform/store";
import { schools } from "@/platform/data/schools";
import { featuredStudent } from "@/platform/data/users";
import { PButton, PCard } from "@/components/platform/ui";
import { roleLabel } from "@/platform/nav";

const roles: Role[] = ["student", "teacher", "admin", "super-admin"];
const roleEmoji: Record<Role, string> = {
  student: "🎒",
  teacher: "👩‍🏫",
  admin: "🎓",
  "super-admin": "🛡️",
};
const subjectOptions: SubjectName[] = ["Maths", "Science", "English", "Telugu", "Social Studies"];

function dashboardHome(role: Role) {
  if (role === "student") return "/platform/student";
  if (role === "teacher") return "/platform/teacher";
  if (role === "admin") return "/platform/admin";
  return "/platform/super-admin";
}

export function LoginScreen() {
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role | null) ?? "student";
  const [role, setRole] = useState<Role>(roles.includes(initialRole) ? initialRole : "student");
  const { loginStudent, loginTeacher, loginAdmin, loginSuperAdmin } = usePlatform();
  const router = useRouter();

  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0].id);
  const [classNum, setClassNum] = useState(6);
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState<SubjectName>("Science");

  const goStudent = (n: string, c: number, s: string, sc: string) => {
    loginStudent({ name: n, classNum: c, section: s, schoolId: sc });
    router.push(dashboardHome("student"));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/platform" className="mb-6 flex items-center gap-2">
        <span className="text-3xl">🧠</span>
        <span className="text-xl font-extrabold text-[var(--p-ink)]">D.Interactive</span>
      </Link>

      <PCard className="w-full max-w-md">
        <div className="mb-5 grid grid-cols-4 gap-1.5 rounded-2xl bg-[var(--p-bg-soft)] p-1.5">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold transition-colors ${
                role === r ? "bg-white text-[var(--p-primary)] shadow" : "text-[var(--p-muted)]"
              }`}
            >
              <span className="text-lg">{roleEmoji[r]}</span>
              {roleLabel[r].split(" ")[0]}
            </button>
          ))}
        </div>

        <motion.div
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {role === "student" && (
            <>
              <PCard className="flex items-center justify-between gap-3 !p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{featuredStudent.avatarEmoji}</span>
                  <div>
                    <p className="text-sm font-bold text-[var(--p-ink)]">{featuredStudent.name}</p>
                    <p className="text-xs text-[var(--p-muted)]">
                      Class {featuredStudent.classNum}{featuredStudent.section} · Sunrise Public School
                    </p>
                  </div>
                </div>
                <PButton
                  size="sm"
                  onClick={() =>
                    goStudent(featuredStudent.name, featuredStudent.classNum, featuredStudent.section, featuredStudent.schoolId)
                  }
                >
                  Go
                </PButton>
              </PCard>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--p-muted)]">
                <span className="h-px flex-1 bg-[var(--p-border)]" /> or sign in <span className="h-px flex-1 bg-[var(--p-border)]" />
              </div>
              <Field label="Your Name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Patel" className="p-input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Class">
                  <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className="p-input">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select value={section} onChange={(e) => setSection(e.target.value)} className="p-input">
                    {["A", "B"].map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="School">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="p-input">
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <PButton onClick={() => goStudent(name || "New Student", classNum, section, schoolId)} size="lg">
                Enter Classroom →
              </PButton>
            </>
          )}

          {role === "teacher" && (
            <>
              <Field label="Your Name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="p-input" />
              </Field>
              <Field label="Subject">
                <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectName)} className="p-input">
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="School">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="p-input">
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <PButton
                onClick={() => {
                  loginTeacher({ name: name || "New Teacher", subject, schoolId });
                  router.push(dashboardHome("teacher"));
                }}
                size="lg"
              >
                Enter Staff Room →
              </PButton>
              <p className="text-center text-xs text-[var(--p-muted)]">
                Try: <strong>Priya Sharma</strong> at Sunrise Public School (Science)
              </p>
            </>
          )}

          {role === "admin" && (
            <>
              <Field label="Your Name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Krishna Murthy" className="p-input" />
              </Field>
              <Field label="School">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="p-input">
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <PButton
                onClick={() => {
                  loginAdmin({ name, schoolId });
                  router.push(dashboardHome("admin"));
                }}
                size="lg"
              >
                Enter Principal Dashboard →
              </PButton>
            </>
          )}

          {role === "super-admin" && (
            <>
              <p className="text-center text-sm text-[var(--p-ink-soft)]">
                Manage every school on the D.Interactive platform.
              </p>
              <PButton
                onClick={() => {
                  loginSuperAdmin();
                  router.push(dashboardHome("super-admin"));
                }}
                size="lg"
              >
                Enter Super Admin Console →
              </PButton>
            </>
          )}
        </motion.div>
      </PCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">{label}</span>
      {children}
    </label>
  );
}
