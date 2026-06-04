import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const APP_SETTINGS_CACHE_TAG = "app-settings";

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

const CACHE_OPTS = { revalidate: 300, tags: [APP_SETTINGS_CACHE_TAG] as string[] };

/** Returns all active weekly offers (only those whose weekStart matches the current Sun–Sat week). */
export const getWeeklyOffers = unstable_cache(
  async (): Promise<WeeklyOffers> => {
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
  },
  ["app-settings-weekly-offers"],
  CACHE_OPTS
);

/** Returns true if the school hours restriction is globally enabled. Defaults to true. */
export const getSchoolHoursEnabled = unstable_cache(
  async (): Promise<boolean> => {
    const setting = await prisma.appSetting.findUnique({ where: { key: "schoolHoursEnabled" } });
    return setting ? setting.value === "true" : true;
  },
  ["app-settings-school-hours"],
  CACHE_OPTS
);

/** Returns true if users can earn coins when retaking a quiz. Defaults to true. */
export const getRetakeCoinsEnabled = unstable_cache(
  async (): Promise<boolean> => {
    const setting = await prisma.appSetting.findUnique({ where: { key: "retakeCoinsEnabled" } });
    return setting ? setting.value === "true" : true;
  },
  ["app-settings-retake-coins"],
  CACHE_OPTS
);

/** Returns true if the "Max Open once per day" restriction is active. Defaults to true. */
export const getMaxOpenLimitEnabled = unstable_cache(
  async (): Promise<boolean> => {
    const setting = await prisma.appSetting.findUnique({ where: { key: "maxOpenLimitEnabled" } });
    return setting ? setting.value === "true" : true;
  },
  ["app-settings-max-open-limit"],
  CACHE_OPTS
);
