import { describe, it, expect, vi, afterEach } from "vitest";
import { isSchoolHours, IST_OFFSET_MS, SCHOOL_HOURS_START, SCHOOL_HOURS_END } from "@/lib/time";

afterEach(() => {
  vi.useRealTimers();
});

/**
 * IST = UTC + 5:30. To simulate an IST time, supply the UTC time that
 * corresponds to it: utcHour = istHour - 5.5
 *
 * E.g., 09:00 IST on a Monday = 03:30 UTC Monday
 */
function setUTC(isoString: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
}

describe("IST constants", () => {
  it("IST_OFFSET_MS is 5.5 hours in ms", () => {
    expect(IST_OFFSET_MS).toBe(5.5 * 60 * 60 * 1000);
  });

  it("school hours are 8–15", () => {
    expect(SCHOOL_HOURS_START).toBe(8);
    expect(SCHOOL_HOURS_END).toBe(15);
  });
});

describe("isSchoolHours()", () => {
  it("returns true during school hours on a weekday (Mon 09:00 IST = Mon 03:30 UTC)", () => {
    // 2026-03-23 is a Monday. 09:00 IST = 03:30 UTC
    setUTC("2026-03-23T03:30:00.000Z");
    expect(isSchoolHours()).toBe(true);
  });

  it("returns true at start of school hours (Mon 08:00 IST = Mon 02:30 UTC)", () => {
    setUTC("2026-03-23T02:30:00.000Z");
    expect(isSchoolHours()).toBe(true);
  });

  it("returns false at end of school hours (Mon 15:00 IST = Mon 09:30 UTC)", () => {
    // hour >= 15 is NOT school hours (exclusive end)
    setUTC("2026-03-23T09:30:00.000Z");
    expect(isSchoolHours()).toBe(false);
  });

  it("returns false before school hours (Mon 07:00 IST = Mon 01:30 UTC)", () => {
    setUTC("2026-03-23T01:30:00.000Z");
    expect(isSchoolHours()).toBe(false);
  });

  it("returns false on Saturday (Sat 10:00 IST = Sat 04:30 UTC)", () => {
    // 2026-03-28 is a Saturday
    setUTC("2026-03-28T04:30:00.000Z");
    expect(isSchoolHours()).toBe(false);
  });

  it("returns false on Sunday (Sun 10:00 IST = Sun 04:30 UTC)", () => {
    // 2026-03-29 is a Sunday
    setUTC("2026-03-29T04:30:00.000Z");
    expect(isSchoolHours()).toBe(false);
  });
});
