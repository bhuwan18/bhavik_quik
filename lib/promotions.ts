import { getISTDateString } from "@/lib/time";

export type Promotion = {
  id: string;
  badge: string;       // e.g. "75% OFF"
  title: string;
  description: string; // one-liner shown on splash
  icon: string;        // emoji
  startDate: string;   // "YYYY-MM-DD" IST (inclusive)
  endDate: string;     // "YYYY-MM-DD" IST (inclusive)
  link: string;        // e.g. "/shop"
  colorFrom: string;   // Tailwind gradient class, e.g. "from-emerald-500"
  colorTo: string;     // Tailwind gradient class, e.g. "to-teal-600"
};

export const PROMOTIONS: Promotion[] = [
  {
    id: "daily-reset-75off-apr2026",
    badge: "75% OFF",
    title: "Daily Reset Sale",
    description: "Reset your daily coin limit for just ₹25 this week — normally ₹100.",
    icon: "🔄",
    startDate: "2026-04-07",
    endDate: "2026-04-13",
    link: "/shop",
    colorFrom: "from-emerald-500",
    colorTo: "to-teal-600",
  },
];

/** Returns promotions active on today's IST date */
export function getActivePromotions(): Promotion[] {
  const today = getISTDateString(new Date());
  return PROMOTIONS.filter((p) => p.startDate <= today && today <= p.endDate);
}
