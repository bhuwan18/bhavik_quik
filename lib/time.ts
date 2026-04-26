// Shared time constants for school hours restriction and IST calculations

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds

export const SCHOOL_EMAIL_DOMAIN = "@oberoi-is.net";
export const SCHOOL_HOURS_START = 8;  // 8:00 AM IST
export const SCHOOL_HOURS_END = 15;   // 3:00 PM IST

/** Returns YYYY-MM-DD string for a given date in IST timezone */
export function getISTDateString(date: Date): string {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().split("T")[0];
}

/** Returns the YYYY-MM-DD IST date string for the day before the given date */
export function getYesterdayISTDateString(date: Date): string {
  return getISTDateString(new Date(date.getTime() - 24 * 60 * 60 * 1000));
}

/** Returns true if the current IST time falls within school hours (Mon–Fri 8–15) */
export function isSchoolHours(): boolean {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  const day = istTime.getUTCDay(); // 0=Sun … 6=Sat
  const hour = istTime.getUTCHours();
  return day >= 1 && day <= 5 && hour >= SCHOOL_HOURS_START && hour < SCHOOL_HOURS_END;
}

/** Returns ISO 8601 week string for a date, e.g. "2026-W15" (weeks start Monday) */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay() || 7; // Sun=0 → 7, Mon=1
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // Thursday of the ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
