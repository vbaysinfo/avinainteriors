import Link from "next/link";
import { PButton, PCard } from "@/components/platform/ui";

const roles = [
  { role: "student", emoji: "🎒", title: "Student", body: "Play interactive labs, do assignments, track XP & badges." },
  { role: "teacher", emoji: "👩‍🏫", title: "Teacher", body: "Assign labs, grade work, spot at-risk students early." },
  { role: "admin", emoji: "🎓", title: "Principal / Admin", body: "Monitor every class and teacher across your school." },
  { role: "super-admin", emoji: "🛡️", title: "Super Admin", body: "Onboard schools and manage the whole platform." },
];

const interactionTypes = [
  { emoji: "🧪", label: "Drag-Mix", desc: "Combine ingredients in a beaker and watch reactions happen" },
  { emoji: "🔢", label: "Drag-to-Count", desc: "Build a count by dragging objects into a basket" },
  { emoji: "🧩", label: "Drag-to-Match", desc: "Match words, letters or capitals to their pictures" },
  { emoji: "🔁", label: "Drag-to-Sequence", desc: "Order steps of a process, timeline or life cycle" },
  { emoji: "🏷️", label: "Drag-to-Label", desc: "Label the parts of a diagram" },
];

export default function PlatformHome() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--p-border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-lg font-extrabold text-[var(--p-ink)]">D.Interactive</span>
          </div>
          <PButton href="/platform/login" size="sm">
            Log In
          </PButton>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-24">
        <span className="inline-block rounded-full bg-[var(--p-primary-soft)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--p-primary-dark)]">
          Class 1 – 10 · Every Subject · One Engine
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight text-[var(--p-ink)] sm:text-6xl">
          Turn every textbook chapter into a{" "}
          <span className="bg-[linear-gradient(90deg,var(--p-primary),var(--p-secondary))] bg-clip-text text-transparent">
            hands-on lab
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--p-ink-soft)] sm:text-lg">
          Students drag, drop, and play their way through Science, Maths, English, Telugu and
          Social Studies — while teachers and principals track real learning progress in real
          time.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <PButton href="/platform/login" size="lg">
            🚀 Try the Live Demo
          </PButton>
          <PButton href="/platform/login?role=student" size="lg" variant="secondary">
            🎒 Jump in as a Student
          </PButton>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-[var(--p-ink)]">
          Choose how you want to explore
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <Link key={r.role} href={`/platform/login?role=${r.role}`}>
              <PCard className="flex h-full flex-col items-center gap-2 text-center transition-transform hover:-translate-y-1">
                <span className="text-4xl">{r.emoji}</span>
                <p className="font-extrabold text-[var(--p-ink)]">{r.title}</p>
                <p className="text-sm text-[var(--p-ink-soft)]">{r.body}</p>
              </PCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[var(--p-bg-soft)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-[var(--p-ink)]">
            One reusable lab engine, every interaction type
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-[var(--p-ink-soft)]">
            Upload a textbook PDF and the content pipeline slots topics into these same
            interactions — no custom UI per chapter.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {interactionTypes.map((it) => (
              <PCard key={it.label} className="text-center">
                <span className="text-3xl">{it.emoji}</span>
                <p className="mt-2 font-extrabold text-[var(--p-ink)]">{it.label}</p>
                <p className="mt-1 text-xs text-[var(--p-ink-soft)]">{it.desc}</p>
              </PCard>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-[var(--p-muted)]">
        Demo build — all school, student and teacher data below is seeded sample data stored in
        your browser, not a real school.{" "}
        <Link href="/" className="underline">
          ← Back to Avina Interiors
        </Link>
      </footer>
    </div>
  );
}
