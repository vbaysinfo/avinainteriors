"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { School } from "@/platform/types";

const emojiChoices = ["🏫", "🌅", "🌿", "📘", "🏛️", "🎓", "🌟", "🦉"];

function AddSchoolForm({ onDone }: { onDone: () => void }) {
  const { addSchool } = usePlatform();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [board, setBoard] = useState<School["board"]>("State Board");
  const [logoEmoji, setLogoEmoji] = useState(emojiChoices[0]);

  const submit = () => {
    if (!name.trim() || !city.trim()) return;
    addSchool({
      name: name.trim(),
      city: city.trim(),
      board,
      logoEmoji,
      colorFrom: "#6d5bfa",
      colorTo: "#14b8a6",
      classesOffered: Array.from({ length: 10 }, (_, i) => i + 1),
      status: "trial",
    });
    onDone();
  };

  return (
    <PCard className="mb-6 flex flex-col gap-3">
      <p className="font-extrabold text-[var(--p-ink)]">Onboard a New School</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" className="p-input" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City, State" className="p-input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={board} onChange={(e) => setBoard(e.target.value as School["board"])} className="p-input">
          <option>State Board</option>
          <option>CBSE</option>
          <option>ICSE</option>
        </select>
        <div className="flex flex-wrap items-center gap-2">
          {emojiChoices.map((e) => (
            <button
              key={e}
              onClick={() => setLogoEmoji(e)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-lg ${
                logoEmoji === e ? "border-[var(--p-primary)]" : "border-transparent"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <PButton onClick={submit} disabled={!name.trim() || !city.trim()} className="self-start">
        Onboard School
      </PButton>
    </PCard>
  );
}

function SchoolsView() {
  const { state } = usePlatform();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PSectionTitle
        title="Schools"
        subtitle="Onboard new schools and manage the ones already on the platform."
        action={<PButton onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "+ Onboard School"}</PButton>}
      />
      {showForm && <AddSchoolForm onDone={() => setShowForm(false)} />}

      <div className="overflow-x-auto rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-[var(--p-border)] text-left text-xs font-bold uppercase text-[var(--p-muted)]">
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Board</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Teachers</th>
              <th className="px-4 py-3">Onboarded</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.schools.map((s) => (
              <tr key={s.id} className="border-b border-[var(--p-border)] last:border-0">
                <td className="flex items-center gap-2 px-4 py-3 font-semibold text-[var(--p-ink)]">
                  <span>{s.logoEmoji}</span> {s.name}
                  <span className="text-xs font-normal text-[var(--p-muted)]">· {s.city}</span>
                </td>
                <td className="px-4 py-3">{s.board}</td>
                <td className="px-4 py-3">{state.students.filter((st) => st.schoolId === s.id).length}</td>
                <td className="px-4 py-3">{state.teachers.filter((t) => t.schoolId === s.id).length}</td>
                <td className="px-4 py-3">{new Date(s.onboardedOn).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <PBadgePill tone={s.status === "active" ? "success" : s.status === "trial" ? "warn" : "danger"}>
                    {s.status}
                  </PBadgePill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SuperAdminSchoolsPage() {
  return (
    <RoleGuard allow={["super-admin"]}>
      <PlatformShell>
        <SchoolsView />
      </PlatformShell>
    </RoleGuard>
  );
}
