"use client";

import { useCallback, useRef, useState } from "react";
import { useBoss } from "@/components/boss/BossProvider";

export type RunQuestion = { id: string; text: string; options: string[]; correctIndex: number; imageUrl?: string | null };

/**
 * Loads a single coherent quiz and accumulates answers against it, so every mode built on
 * this hook submits exactly one valid quizId + matching answers to /api/attempt — real coins,
 * real boss damage. (HackDevGame.tsx re-fetches a *different* quiz at submit time and earns
 * ~0 as a result; this hook exists specifically so that mistake can't happen again.)
 */
export function useQuizRun() {
  const boss = useBoss();
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState<RunQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const answersRef = useRef<{ questionId: string; selectedIndex: number }[]>([]);
  const quizIdRef = useRef("");

  // Resolves with the freshly loaded questions directly (not just a success flag) so a
  // caller that needs them immediately after awaiting load() — e.g. to pick the first
  // question of a run — never reads back the pre-load empty array from a stale render
  // closure while waiting for the setQuestions() state update to actually commit.
  const load = useCallback(async (categorySlug: string | null): Promise<RunQuestion[] | null> => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = categorySlug ? `?official=true&category=${encodeURIComponent(categorySlug)}` : "?official=true";
      const res = await fetch(`/api/quizzes${qs}`);
      const data = await res.json();
      const quizzes = data?.quizzes ?? data;
      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        setLoadError("No quizzes found for that category.");
        return null;
      }
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      const qList: RunQuestion[] = full?.questions ?? [];
      if (!qList.length) {
        setLoadError("That quiz has no questions. Please try again.");
        return null;
      }
      quizIdRef.current = quiz.id;
      answersRef.current = [];
      setQuizId(quiz.id);
      setQuestions(qList);
      return qList;
    } catch (e) {
      setLoadError(`Failed to load questions: ${e instanceof Error ? e.message : "unknown error"}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAnswer = useCallback((questionId: string, selectedIndex: number) => {
    answersRef.current = [...answersRef.current, { questionId, selectedIndex }];
  }, []);

  const submit = useCallback(async (): Promise<{ coinsEarned: number } | null> => {
    if (!quizIdRef.current || answersRef.current.length === 0) return null;
    try {
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quizIdRef.current, answers: answersRef.current }),
      });
      const data = await res.json();
      boss.reconcileAttempt(data.boss ?? null);
      return { coinsEarned: data.coinsEarned ?? 0 };
    } catch {
      return null;
    }
  }, [boss]);

  return { quizId, questions, loading, loadError, load, recordAnswer, submit };
}
