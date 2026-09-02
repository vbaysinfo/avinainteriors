"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { LabContent, SubjectName, TeacherUser } from "@/platform/types";
import { generateMockLab, pipelineSteps } from "@/platform/lib/pdfPipeline";

function ContentPipelineView() {
  const { state, addLabDraft, publishLab, currentUser } = usePlatform();
  const teacher = currentUser as TeacherUser;
  const [subject, setSubject] = useState<SubjectName>(teacher.subjects[0] ?? "Science");
  const [classNum, setClassNum] = useState(teacher.classesHandled[0] ?? 6);
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<{ topic: string; chapter: string; description: string } | null>(null);

  const pendingLabs = state.labs.filter((l) => l.status === "pending-review");

  const runPipeline = () => {
    if (!topic.trim()) return;
    setProcessing(true);
    setStepIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= pipelineSteps.length) {
        clearInterval(interval);
        const lab = generateMockLab({ subject, classNum, topic, chapter, sourceFileName: fileName ?? undefined });
        addLabDraft(lab);
        setProcessing(false);
        setStepIndex(-1);
        setReviewingId(lab.id);
        setEdits({ topic: lab.topic, chapter: lab.chapter, description: lab.description });
        setTopic("");
        setChapter("");
        setFileName(null);
      } else {
        setStepIndex(i);
      }
    }, 550);
  };

  const reviewingLab = state.labs.find((l) => l.id === reviewingId) ?? null;

  const publish = (lab: LabContent) => {
    publishLab({
      ...lab,
      topic: edits?.topic || lab.topic,
      chapter: edits?.chapter || lab.chapter,
      description: edits?.description || lab.description,
      status: "published",
    });
    setReviewingId(null);
    setEdits(null);
  };

  return (
    <div>
      <PSectionTitle
        title="Content Pipeline"
        subtitle="Upload a textbook PDF and the engine drafts an interactive lab automatically — you review before it goes live."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <PCard>
          <p className="mb-4 font-extrabold text-[var(--p-ink)]">1. Upload & Generate</p>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--p-border)] p-6 text-center hover:border-[var(--p-primary)]">
              <UploadCloud className="h-8 w-8 text-[var(--p-primary)]" />
              <span className="text-sm font-bold text-[var(--p-ink)]">
                {fileName ?? "Click to choose a textbook PDF"}
              </span>
              <span className="text-xs text-[var(--p-muted)]">(Demo — file is not actually parsed)</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectName)} className="p-input">
                {(["Maths", "Science", "English", "Telugu", "Social Studies"] as SubjectName[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className="p-input">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="Chapter name (e.g. Photosynthesis)"
              className="p-input"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic name (e.g. How Leaves Make Food)"
              className="p-input"
            />
            <PButton onClick={runPipeline} disabled={!topic.trim() || processing}>
              {processing ? "Processing…" : "Generate Lab from PDF"}
            </PButton>

            <AnimatePresence>
              {processing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex flex-col gap-2">
                  {pipelineSteps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-sm">
                      {i < stepIndex ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--p-success)]" />
                      ) : i === stepIndex ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--p-primary)]" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-[var(--p-border)]" />
                      )}
                      <span className={i <= stepIndex ? "text-[var(--p-ink)]" : "text-[var(--p-muted)]"}>{step}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PCard>

        <PCard>
          <p className="mb-4 font-extrabold text-[var(--p-ink)]">2. Review Queue</p>
          <div className="flex flex-col gap-3">
            {pendingLabs.length === 0 && (
              <PEmptyState emoji="✅" title="Nothing waiting for review" body="Generate a lab to see it here." />
            )}
            {pendingLabs.map((lab) => (
              <div key={lab.id} className="rounded-2xl border border-[var(--p-border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{lab.targetEmoji}</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--p-ink)]">{lab.topic}</p>
                      <p className="text-xs text-[var(--p-muted)]">
                        {lab.subject} · Class {lab.classNum} · {lab.interactionType.replace(/-/g, " ")}
                      </p>
                    </div>
                  </div>
                  <PBadgePill tone={lab.source === "pdf-generated" ? "accent" : "muted"}>
                    {lab.source === "pdf-generated" ? "AI Draft" : "Manual"}
                  </PBadgePill>
                </div>
                <PButton
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setReviewingId(lab.id);
                    setEdits({ topic: lab.topic, chapter: lab.chapter, description: lab.description });
                  }}
                >
                  Review & Edit
                </PButton>
              </div>
            ))}
          </div>
        </PCard>
      </div>

      <AnimatePresence>
        {reviewingLab && edits && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <PCard>
              <p className="mb-4 font-extrabold text-[var(--p-ink)]">3. Teacher Review — edit before publishing</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[var(--p-muted)]">Chapter</span>
                  <input
                    value={edits.chapter}
                    onChange={(e) => setEdits({ ...edits, chapter: e.target.value })}
                    className="p-input"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[var(--p-muted)]">Topic</span>
                  <input
                    value={edits.topic}
                    onChange={(e) => setEdits({ ...edits, topic: e.target.value })}
                    className="p-input"
                  />
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-[var(--p-muted)]">Explanation Card</span>
                <textarea
                  value={edits.description}
                  onChange={(e) => setEdits({ ...edits, description: e.target.value })}
                  rows={2}
                  className="p-input"
                />
              </label>

              <p className="mt-4 mb-2 text-xs font-bold uppercase text-[var(--p-muted)]">Generated Items</p>
              <div className="flex flex-wrap gap-3">
                {reviewingLab.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-1 rounded-xl border border-[var(--p-border)] p-3"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <PButton onClick={() => publish(reviewingLab)}>✅ Publish to Students</PButton>
                <PButton variant="ghost" onClick={() => setReviewingId(null)}>
                  Keep in Draft
                </PButton>
              </div>
            </PCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContentPipelinePage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <PlatformShell>
        <ContentPipelineView />
      </PlatformShell>
    </RoleGuard>
  );
}
