import { describe, expect, it } from "vitest";
import { formatClock, formatDuration } from "./format";

describe("formatClock", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65_000)).toBe("01:05");
  });
  it("adds hours from one hour up and never goes negative", () => {
    expect(formatClock(3_725_000)).toBe("1:02:05");
    expect(formatClock(-5)).toBe("00:00");
  });
});

describe("formatDuration", () => {
  it("picks a compact unit", () => {
    expect(formatDuration(40_000)).toBe("40s");
    expect(formatDuration(25 * 60_000)).toBe("25m");
    expect(formatDuration(65 * 60_000)).toBe("1h 05m");
  });
});
