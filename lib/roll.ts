import type { Quizlet } from "@prisma/client";

const DROP_WEIGHTS: Record<string, number> = {
  common: 6000,
  uncommon: 2500,
  rare: 1000,
  epic: 400,
  legendary: 100,
  secret: 10,
  unique: 1,
  impossible: 0, // handled separately for rainbow-pack only
};

const RAINBOW_IMPOSSIBLE_CHANCE = 0.00001; // 0.001%

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
  const results: Quizlet[] = [];

  // Guaranteed slots based on rarity structure
  const guaranteed: string[] = ["common", "common", "uncommon", "uncommon", "rare"];

  for (const guaranteedRarity of guaranteed) {
    const pool = packQuizlets.filter((q) => q.rarity === guaranteedRarity);
    const fallback = packQuizlets.filter((q) => !q.isHidden);

    const pick = pool.length > 0 ? weightedRandom(pool) : weightedRandom(fallback);
    if (pick) results.push(pick);
  }

  // One bonus roll (can hit epic/legendary/secret/unique)
  const bonusPool = packQuizlets.filter((q) =>
    ["epic", "legendary", "secret", "unique"].includes(q.rarity)
  );

  if (packSlug === "rainbow-pack" && Math.random() < RAINBOW_IMPOSSIBLE_CHANCE) {
    const impossible = allQuizlets.find((q) => q.rarity === "impossible");
    if (impossible) results.push(impossible);
  } else if (bonusPool.length > 0) {
    const bonusPick = weightedRandom(bonusPool);
    if (bonusPick) results.push(bonusPick);
  }

  // Small chance to get a unique (any pack)
  if (Math.random() < 0.0001) {
    const uniques = allQuizlets.filter((q) => q.rarity === "unique");
    if (uniques.length > 0) {
      const pick = uniques[Math.floor(Math.random() * uniques.length)];
      results.push(pick);
    }
  }

  return results;
}
