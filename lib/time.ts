// Shared time constants for school hours restriction and IST calculations

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds

export const SCHOOL_EMAIL_DOMAIN = "@oberoi-is.net";
export const SCHOOL_HOURS_START = 8;  // 8:00 AM IST
export const SCHOOL_HOURS_END = 15;   // 3:00 PM IST

/** Returns true if the current IST time falls within school hours (Mon–Fri 8–15) */
export function isSchoolHours(): boolean {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  const day = istTime.getUTCDay(); // 0=Sun … 6=Sat
  const hour = istTime.getUTCHours();
  return day >= 1 && day <= 5 && hour >= SCHOOL_HOURS_START && hour < SCHOOL_HOURS_END;
}
