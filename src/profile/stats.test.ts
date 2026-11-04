import { describe, expect, it } from "vitest";
import { currentStreak, dayKey, profileStats } from "./stats";

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Local noon of a given day offset from a fixed "now", to stay clear of midnight edges. */
const NOW = new Date(2026, 10, 4, 15, 0).getTime();
const at = (back: number, hour = 12) => {
  const d = new Date(NOW);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, hour).getTime();
};

const entry = (back: number, focusedMin: number, status: "completed" | "failed" | "abandoned" = "completed", counted = focusedMin) => ({
  endedAt: at(back),
  focusedMs: focusedMin * MIN,
  countedMs: counted * MIN,
  status,
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak([entry(0, 30), entry(1, 30), entry(2, 30)], NOW)).toBe(3);
  });
  it("is not broken by a still-empty today", () => {
    expect(currentStreak([entry(1, 30), entry(2, 30)], NOW)).toBe(2);
  });
  it("breaks on a missed day", () => {
    expect(currentStreak([entry(0, 30), entry(2, 30)], NOW)).toBe(1);
    expect(currentStreak([entry(2, 30), entry(3, 30)], NOW)).toBe(0);
  });
  it("ignores failed, abandoned and short sessions", () => {
    expect(currentStreak([entry(0, 30, "failed"), entry(0, 30, "abandoned")], NOW)).toBe(0);
    expect(currentStreak([entry(0, 5)], NOW)).toBe(0);
  });
});

describe("profileStats", () => {
  it("totals hours for today, the week, the month and all time", () => {
    const s = profileStats(
      [entry(0, 60), entry(3, 30), entry(10, 120), entry(45, 60)],
      NOW
    );
    expect(s.todayMs).toBe(HOUR);
    expect(s.last7Ms).toBe(90 * MIN);
    expect(s.last30Ms).toBe(210 * MIN);
    expect(s.totalMs).toBe(270 * MIN);
    expect(s.sessions).toBe(4);
  });

  it("returns seven days ending today", () => {
    const s = profileStats([entry(2, 40)], NOW);
    expect(s.days).toHaveLength(7);
    expect(dayKey(s.days[6].day)).toBe(dayKey(NOW));
    expect(s.days[4].ms).toBe(40 * MIN);
  });

  it("counts failed sessions' counted time but not as streak days", () => {
    const s = profileStats([entry(0, 20, "failed")], NOW);
    expect(s.todayMs).toBe(20 * MIN);
    expect(s.streak).toBe(0);
  });

  it("derives the rank from total hours", () => {
    expect(profileStats([entry(0, 30)], NOW).rank.current.name).toBe("Starter");
    expect(profileStats([entry(1, 700, "completed", 700)], NOW).rank.current.name).toBe("Focused");
  });

  it("handles no sessions", () => {
    const s = profileStats([], NOW);
    expect(s.totalMs).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.sessions).toBe(0);
  });
});
