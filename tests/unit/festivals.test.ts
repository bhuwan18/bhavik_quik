import { describe, it, expect, vi, afterEach } from "vitest";
import { getTodaysFestival, getActiveFestivalPackSlugs, FESTIVALS } from "@/lib/festivals";

afterEach(() => {
  vi.useRealTimers();
});

function setDate(mm: string, dd: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`2026-${mm}-${dd}T12:00:00.000Z`));
}

describe("FESTIVALS", () => {
  it("has 6 festivals", () => {
    expect(FESTIVALS).toHaveLength(6);
  });

  it("every festival has name, date (MM-DD), packSlug, and icon", () => {
    for (const f of FESTIVALS) {
      expect(f.name).toBeTruthy();
      expect(f.date).toMatch(/^\d{2}-\d{2}$/);
      expect(f.packSlug).toBeTruthy();
      expect(f.icon).toBeTruthy();
    }
  });
});

describe("getTodaysFestival()", () => {
  it("returns New Year Bash on 01-01", () => {
    setDate("01", "01");
    const festival = getTodaysFestival();
    expect(festival?.name).toBe("New Year Bash");
    expect(festival?.packSlug).toBe("newyear-pack");
  });

  it("returns Valentine's Day on 02-14", () => {
    setDate("02", "14");
    expect(getTodaysFestival()?.name).toBe("Valentine's Day");
  });

  it("returns Halloween Haunt on 10-31", () => {
    setDate("10", "31");
    expect(getTodaysFestival()?.name).toBe("Halloween Haunt");
  });

  it("returns Christmas Magic on 12-25", () => {
    setDate("12", "25");
    expect(getTodaysFestival()?.name).toBe("Christmas Magic");
  });

  it("returns null on a non-festival day", () => {
    setDate("06", "15");
    expect(getTodaysFestival()).toBeNull();
  });
});

describe("getActiveFestivalPackSlugs()", () => {
  it("returns pack slug on a festival day", () => {
    setDate("12", "25");
    expect(getActiveFestivalPackSlugs()).toEqual(["xmas-pack"]);
  });

  it("returns empty array on a non-festival day", () => {
    setDate("07", "04");
    expect(getActiveFestivalPackSlugs()).toEqual([]);
  });
});
