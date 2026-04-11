import { prisma } from "@/lib/db";

// ─── Weekly Offers ────────────────────────────────────────────────────────────

export type WeeklyOfferType = "pro" | "max" | "daily_reset" | "coins";
export type WeeklyOffer = { discountPercent: number; weekStart: string };
export type WeeklyOffers = Partial<Record<WeeklyOfferType, WeeklyOffer>>;

const OFFER_KEYS: Record<WeeklyOfferType, string> = {
  pro: "weeklyOffer_pro",
  max: "weeklyOffer_max",
  daily_reset: "weeklyOffer_daily_reset",
  coins: "weeklyOffer_coins",
};

export const OFFER_KEY_MAP = OFFER_KEYS;

/** Returns midnight (UTC) of the most recent Sunday. */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - now.getUTCDay());
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** Returns all active weekly offers (only those whose weekStart matches the current Sun–Sat week). */
export async function getWeeklyOffers(): Promise<WeeklyOffers> {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: Object.values(OFFER_KEYS) } },
  });
  const weekStart = getCurrentWeekStart();
  const result: WeeklyOffers = {};
  for (const s of settings) {
    const entry = Object.entries(OFFER_KEYS).find(([, k]) => k === s.key);
    if (!entry) continue;
    const type = entry[0] as WeeklyOfferType;
    try {
      const offer = JSON.parse(s.value) as WeeklyOffer;
      const offerDay = new Date(offer.weekStart);
      if (
        offerDay.getUTCFullYear() === weekStart.getUTCFullYear() &&
        offerDay.getUTCMonth() === weekStart.getUTCMonth() &&
        offerDay.getUTCDate() === weekStart.getUTCDate()
      ) {
        result[type] = offer;
      }
    } catch {
      // skip malformed
    }
  }
  return result;
}

/**
 * Returns true if the school hours restriction is globally enabled.
 * Defaults to true if the setting has never been saved.
 */
export async function getSchoolHoursEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "schoolHoursEnabled" },
  });
  return setting ? setting.value === "true" : true;
}

/**
 * Returns true if users can earn coins when retaking a quiz (re-answering
 * questions they have already answered correctly before).
 * Defaults to true if the setting has never been saved.
 */
export async function getRetakeCoinsEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "retakeCoinsEnabled" },
  });
  return setting ? setting.value === "true" : true;
}
