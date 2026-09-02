"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LabContent } from "@/platform/types";
import { DragMix } from "@/components/platform/lab-engine/DragMix";
import { DragMatch } from "@/components/platform/lab-engine/DragMatch";
import { DragCount } from "@/components/platform/lab-engine/DragCount";
import { DragSequence } from "@/components/platform/lab-engine/DragSequence";
import { Quiz } from "@/components/platform/lab-engine/Quiz";
import { Confetti } from "@/components/platform/lab-engine/Confetti";
import { PBadgePill, PButton, PCard } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import { playSound } from "@/platform/lib/sound";
import { getBadge } from "@/platform/data/badges";
import { useRouter } from "next/navigation";

type Stage = "lab" | "interaction-done" | "quiz" | "summary";

export function LabEngine({
  lab,
  studentId,
  assignmentId,
}: {
  lab: LabContent;
  studentId: string;
  assignmentId?: string;
}) {
  const { recordLabAttempt, submitAssignment, state } = usePlatform();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("lab");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(1);
  const [interactionScore, setInteractionScore] = useState({ score: 0, max: 1 });
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const handleInteractionComplete = (score: number, max: number) => {
    playSound("complete");
    setInteractionScore({ score, max: Math.max(max, 1) });
    setStage("interaction-done");
  };

  const goToQuiz = () => setStage(lab.quiz.length > 0 ? "quiz" : "summary");

  const finishLab = (quizCorrect: number, quizTotal: number) => {
    const interactionPct = interactionScore.score / interactionScore.max;
    const quizPct = quizTotal > 0 ? quizCorrect / quizTotal : 1;
    const combinedPct = quizTotal > 0 ? interactionPct * 0.5 + quizPct * 0.5 : interactionPct;
    const badges = recordLabAttempt(studentId, lab.id, lab.xp, Math.round(combinedPct * 100), 100);
    setEarnedBadges(badges);

    if (assignmentId) {
      const assignment = state.assignments.find((a) => a.id === assignmentId);
      if (assignment) {
        submitAssignment(assignmentId, studentId, {
          auto: true,
          score: Math.round(assignment.maxScore * combinedPct),
        });
      }
    }
    setStage("summary");
  };

  const handleQuizSubmit = (correct: number, qTotal: number) => {
    setQuizResult({ correct, total: qTotal });
    finishLab(correct, qTotal);
  };

  const interactionMap: Record<string, React.ReactNode> = {
    "drag-mix": (
      <DragMix
        lab={lab}
        onProgress={(d, t) => {
          setDone(d);
          setTotal(t);
        }}
        onComplete={handleInteractionComplete}
      />
    ),
    "drag-to-match": (
      <DragMatch
        lab={lab}
        onProgress={(d, t) => {
          setDone(d);
          setTotal(t);
        }}
        onComplete={handleInteractionComplete}
      />
    ),
    "drag-to-label": (
      <DragMatch
        lab={lab}
        onProgress={(d, t) => {
          setDone(d);
          setTotal(t);
        }}
        onComplete={handleInteractionComplete}
      />
    ),
    "drag-to-count": (
      <DragCount
        lab={lab}
        onProgress={(d, t) => {
          setDone(d);
          setTotal(t);
        }}
        onComplete={handleInteractionComplete}
      />
    ),
    "drag-to-sequence": (
      <DragSequence
        lab={lab}
        onProgress={(d, t) => {
          setDone(d);
          setTotal(t);
        }}
        onComplete={handleInteractionComplete}
      />
    ),
  };

  return (
    <div className="relative">
      {stage === "lab" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--p-muted)]">
              {done} of {total} discovered
            </p>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--p-bg-soft)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--p-primary),var(--p-secondary))] transition-all"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          {interactionMap[lab.interactionType]}
        </>
      )}

      {stage === "interaction-done" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center gap-4 rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)] p-10 text-center"
        >
          <Confetti />
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-extrabold text-[var(--p-ink)]">Activity complete!</h3>
          <p className="text-sm text-[var(--p-ink-soft)]">
            You discovered {interactionScore.score} of {interactionScore.max} points worth of reactions.
          </p>
          <PButton onClick={goToQuiz} size="lg">
            {lab.quiz.length > 0 ? "Take the Quick Quiz →" : "Finish Lab →"}
          </PButton>
        </motion.div>
      )}

      {stage === "quiz" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PCard>
            <Quiz questions={lab.quiz} onSubmit={handleQuizSubmit} />
          </PCard>
        </motion.div>
      )}

      {stage === "summary" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center gap-4 rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)] p-10 text-center"
        >
          <Confetti count={36} />
          <span className="text-6xl">🏆</span>
          <h3 className="text-2xl font-extrabold text-[var(--p-ink)]">Chapter lab complete!</h3>
          <p className="text-sm text-[var(--p-ink-soft)]">
            +{lab.xp} XP earned
            {quizResult ? ` · Quiz: ${quizResult.correct}/${quizResult.total} correct` : ""}
          </p>
          {earnedBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {earnedBadges.map((id) => {
                const badge = getBadge(id);
                if (!badge) return null;
                return (
                  <PBadgePill key={id} tone="accent">
                    {badge.emoji} New badge: {badge.name}
                  </PBadgePill>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <PButton variant="secondary" onClick={() => router.push("/platform/student/labs")}>
              Back to Labs
            </PButton>
            <PButton onClick={() => window.location.reload()}>Try Again</PButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
