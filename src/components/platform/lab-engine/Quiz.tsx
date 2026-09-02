"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { QuizQuestion } from "@/platform/types";
import { PButton } from "@/components/platform/ui";
import { playSound } from "@/platform/lib/sound";

export function Quiz({
  questions,
  onSubmit,
}: {
  questions: QuizQuestion[];
  onSubmit: (correctCount: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    setSubmitted(true);
    playSound(correct === questions.length ? "complete" : "correct");
    onSubmit(correct, questions.length);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-[var(--p-ink-soft)]">
        Quick check — pick the best answer for each question.
      </p>
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-2xl border border-[var(--p-border)] bg-[var(--p-bg-soft)] p-4">
          <p className="mb-3 text-sm font-bold text-[var(--p-ink)]">
            {qi + 1}. {q.question}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              const isCorrect = submitted && oi === q.correctIndex;
              const isWrongPick = submitted && selected && oi !== q.correctIndex;
              return (
                <motion.button
                  key={oi}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={submitted}
                  onClick={() => {
                    playSound("click");
                    setAnswers((prev) => ({ ...prev, [q.id]: oi }));
                  }}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    isCorrect
                      ? "border-[var(--p-success)] bg-[var(--p-success-soft)] text-[#166534]"
                      : isWrongPick
                        ? "border-[var(--p-danger)] bg-[var(--p-danger-soft)] text-[var(--p-danger)]"
                        : selected
                          ? "border-[var(--p-primary)] bg-[var(--p-primary-soft)] text-[var(--p-primary-dark)]"
                          : "border-[var(--p-border)] bg-white text-[var(--p-ink-soft)] hover:border-[var(--p-primary)]"
                  }`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted && (
        <PButton onClick={handleSubmit} disabled={!allAnswered} className="self-start">
          Submit Quiz
        </PButton>
      )}
    </div>
  );
}
