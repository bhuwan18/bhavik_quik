export type Festival = {
  name: string;
  date: string; // "MM-DD"
  packSlug: string;
  icon: string;
};

export const FESTIVALS: Festival[] = [
  { name: "New Year Bash", date: "01-01", packSlug: "newyear-pack", icon: "🎆" },
  { name: "Valentine's Day", date: "02-14", packSlug: "love-pack", icon: "❤️" },
  { name: "Holi Splash", date: "03-25", packSlug: "holi-pack", icon: "🌈" },
  { name: "Halloween Haunt", date: "10-31", packSlug: "spooky-pack", icon: "🎃" },
  { name: "Diwali Glow", date: "11-01", packSlug: "diwali-pack", icon: "🪔" },
  { name: "Christmas Magic", date: "12-25", packSlug: "xmas-pack", icon: "🎄" },
];

export function getTodaysFestival(): Festival | null {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;
  return FESTIVALS.find((f) => f.date === today) ?? null;
}

export function getActiveFestivalPackSlugs(): string[] {
  const festival = getTodaysFestival();
  return festival ? [festival.packSlug] : [];
}
