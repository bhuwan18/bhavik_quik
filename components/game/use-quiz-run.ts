"use client";

import { useCallback, useRef, useState } from "react";
import { useBoss } from "@/components/boss/BossProvider";

export type RunQuestion = { id: string; text: string; options: string[]; correctIndex: number };

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

  const load = useCallback(async (categorySlug: string | null): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = categorySlug ? `?official=true&category=${encodeURIComponent(categorySlug)}` : "?official=true";
      const res = await fetch(`/api/quizzes${qs}`);
      const data = await res.json();
      const quizzes = data?.quizzes ?? data;
      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        setLoadError("No quizzes found for that category.");
        return false;
      }
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      const qList: RunQuestion[] = full?.questions ?? [];
      if (!qList.length) {
        setLoadError("That quiz has no questions. Please try again.");
        return false;
      }
      quizIdRef.current = quiz.id;
      answersRef.current = [];
      setQuizId(quiz.id);
      setQuestions(qList);
      return true;
    } catch (e) {
      setLoadError(`Failed to load questions: ${e instanceof Error ? e.message : "unknown error"}`);
      return false;
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
