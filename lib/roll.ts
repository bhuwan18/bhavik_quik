import type { Quizlet } from "@prisma/client";

const DROP_WEIGHTS: Record<string, number> = {
  common: 6000,
  uncommon: 2500,
  rare: 1000,
  epic: 400,
  legendary: 100,
  secret: 10,
  unique: 1,
  impossible: 0,
};

const RAINBOW_IMPOSSIBLE_CHANCE = 0.00001;

function weightedRandom(items: Quizlet[]): Quizlet | null {
  if (items.length === 0) return null;
  const weights = items.map((q) => DROP_WEIGHTS[q.rarity] ?? 0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return null;
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function rollPackOpening(
  packSlug: string,
  packQuizlets: Quizlet[],
  allQuizlets: Quizlet[]
): Quizlet[] {
  // Ultra-rare: impossible from rainbow pack
  if (packSlug === "rainbow-pack" && Math.random() < RAINBOW_IMPOSSIBLE_CHANCE) {
    const impossible = allQuizlets.find((q) => q.rarity === "impossible");
    if (impossible) return [impossible];
  }

  // Tiny chance for a unique from any pack
  if (Math.random() < 0.0001) {
    const uniques = allQuizlets.filter((q) => q.rarity === "unique");
    if (uniques.length > 0) {
      return [uniques[Math.floor(Math.random() * uniques.length)]];
    }
  }

  // Single weighted roll from pack pool
  const pool = packQuizlets.filter((q) => !q.isHidden);
  const pick = weightedRandom(pool);
  return pick ? [pick] : [];
}
