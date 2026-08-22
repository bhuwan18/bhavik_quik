// ─── Progressive, no-repeat question selection for game-mode reward gates ────────
// Zero imports beyond game-config — pure, unit-testable without React or the DOM.
//
// Used by Monster Hunter (level-up gate), Gold Quest (chest gate), and Tower Defense
// (continuous Q&A) so a wrong answer never dead-ends the interaction: the caller just
// asks pickNextQuestion() again for a fresh question and keeps the reward gate open
// until the player succeeds, instead of skipping the reward outright.

import { QP_LEVELS_TO_FULL_POOL, QP_MIN_BAND_FRACTION } from "@/lib/game-config";

export type PickableQuestion = { id: string };

/**
 * Picks the next question to show, biasing toward harder (later-ordered) questions as
 * `level` rises, while avoiding repeats within the run until the eligible pool is
 * genuinely exhausted. `questions` must already be ordered easiest→hardest (the quiz
 * API's default `order asc` sort satisfies this — it's the only per-question difficulty
 * signal this app has).
 */
export function pickNextQuestion<T extends PickableQuestion>(
  questions: readonly T[],
  askedIds: ReadonlySet<string>,
  level: number
): T | null {
  if (questions.length === 0) return null;

  const progress = Math.min(1, Math.max(0, (level - 1) / QP_LEVELS_TO_FULL_POOL));
  const bandFraction = QP_MIN_BAND_FRACTION + progress * (1 - QP_MIN_BAND_FRACTION);
  const bandSize = Math.max(1, Math.ceil(questions.length * bandFraction));
  const band = questions.slice(0, bandSize);

  const unaskedInBand = band.filter((q) => !askedIds.has(q.id));
  if (unaskedInBand.length > 0) {
    return unaskedInBand[Math.floor(Math.random() * unaskedInBand.length)];
  }

  const unaskedAnywhere = questions.filter((q) => !askedIds.has(q.id));
  if (unaskedAnywhere.length > 0) {
    return unaskedAnywhere[Math.floor(Math.random() * unaskedAnywhere.length)];
  }

  // Every question has been asked this run — repeats are unavoidable, but still bias
  // toward the current difficulty band rather than picking uniformly across the pool.
  return band[Math.floor(Math.random() * band.length)];
}
