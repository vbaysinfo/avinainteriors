"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, Volume2, VolumeX } from "lucide-react";
import { usePlatform } from "@/platform/store";
import { navByRole, roleLabel } from "@/platform/nav";
import { getSchool } from "@/platform/data/schools";
import type { StudentUser } from "@/platform/types";
import { levelFromXp } from "@/platform/lib/gamification";
import { isMuted, setMuted } from "@/platform/lib/sound";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { state, currentUser, logout } = usePlatform();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted);

  if (!currentUser || !state.session) return <>{children}</>;

  const school = currentUser.schoolId !== "platform" ? getSchool(currentUser.schoolId) : null;
  const items = navByRole[state.session.role];
  const isStudent = currentUser.role === "student";
  const student = isStudent ? (currentUser as StudentUser) : null;
  const level = student ? levelFromXp(student.xp) : null;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="p-scrollbar mx-auto flex min-h-screen max-w-[1600px]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-[var(--p-border)] bg-[var(--p-surface)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : ""
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <Link href="/platform" className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="text-lg font-extrabold text-[var(--p-ink)]">
                D.Interactive
              </span>
            </Link>
            <button
              className="rounded-lg p-1.5 text-[var(--p-muted)] lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {school && (
            <div
              className="mt-5 flex items-center gap-2 rounded-2xl p-3 text-white"
              style={{
                background: `linear-gradient(135deg, ${school.colorFrom}, ${school.colorTo})`,
              }}
            >
              <span className="text-xl">{school.logoEmoji}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{school.name}</p>
                <p className="truncate text-xs opacity-85">{school.city}</p>
              </div>
            </div>
          )}

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--p-primary-soft)] text-[var(--p-primary-dark)]"
                      : "text-[var(--p-ink-soft)] hover:bg-[var(--p-bg-soft)]"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {student && level && (
            <div className="mb-4 rounded-2xl border border-[var(--p-border)] bg-[var(--p-bg-soft)] p-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--p-ink-soft)]">
                <span>Level {level.level}</span>
                <span>{student.xp} XP</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--p-primary),var(--p-secondary))]"
                  style={{ width: `${level.progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-[var(--p-accent)]">
                🔥 {student.streakDays} day streak
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-[var(--p-border)] pt-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--p-primary-soft)] text-xl">
              {currentUser.avatarEmoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--p-ink)]">{currentUser.name}</p>
              <p className="truncate text-xs text-[var(--p-muted)]">
                {roleLabel[currentUser.role]}
                {student ? ` · Class ${student.classNum}${student.section}` : ""}
              </p>
            </div>
            <button
              onClick={toggleMute}
              aria-label="Toggle sound"
              className="rounded-lg p-1.5 text-[var(--p-muted)] hover:bg-[var(--p-bg-soft)]"
              title="Toggle lab sound effects"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                logout();
                router.push("/platform");
              }}
              aria-label="Log out"
              className="rounded-lg p-1.5 text-[var(--p-muted)] hover:bg-[var(--p-danger-soft)] hover:text-[var(--p-danger)]"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="min-h-screen flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--p-border)] bg-[var(--p-bg)]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[var(--p-border)] p-2 text-[var(--p-ink)]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-[var(--p-ink)]">D.Interactive</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
