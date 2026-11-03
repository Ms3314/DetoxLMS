import { describe, expect, it } from "vitest";
import { advance, end, isPaused, leave, remainingMs, returnToFocus, startSession } from "./engine";
import { applyDailyCap, countedMs, countsForStreak, rankFor } from "./stats";
import { GRACE_MS, MAX_AWAY_MS, MIN_COUNTED_MS } from "./rules";

const S = 1000;
const MIN = 60 * S;

describe("focusing", () => {
  it("counts elapsed time from timestamps", () => {
    const s = advance(startSession(0, null), 5 * MIN);
    expect(s.status).toBe("focusing");
    expect(s.focusedMs).toBe(5 * MIN);
  });

  it("completes at the target even if noticed late", () => {
    const s = advance(startSession(0, 25 * MIN), 90 * MIN);
    expect(s.status).toBe("completed");
    expect(s.focusedMs).toBe(25 * MIN);
    expect(s.endedAt).toBe(25 * MIN);
  });

  it("reports remaining time", () => {
    const s = advance(startSession(0, 25 * MIN), 10 * MIN);
    expect(remainingMs(s)).toBe(15 * MIN);
    expect(remainingMs(startSession(0, null))).toBeNull();
  });
});

describe("leaving", () => {
  it("forgives a return within the grace period", () => {
    let s = startSession(0, null);
    s = leave(s, 1 * MIN);
    s = returnToFocus(s, 1 * MIN + 5 * S);
    expect(s.status).toBe("focusing");
    expect(s.strikes).toBe(0);
    expect(s.awayMs).toBe(0);
    expect(s.focusedMs).toBe(1 * MIN + 5 * S);
  });

  it("keeps counting during the grace period, then pauses and logs away time", () => {
    let s = leave(startSession(0, null), 1 * MIN);
    s = advance(s, 1 * MIN + 40 * S);
    expect(isPaused(s, 1 * MIN + 40 * S)).toBe(true);
    expect(s.focusedMs).toBe(1 * MIN + GRACE_MS);
    expect(s.awayMs).toBe(30 * S);
    expect(s.strikes).toBe(1);
  });

  it("counts the strike once per absence", () => {
    let s = leave(startSession(0, null), 0);
    s = advance(s, 20 * S);
    s = advance(s, 30 * S);
    expect(s.strikes).toBe(1);
  });

  it("resumes focusing after a long absence without failing", () => {
    let s = leave(startSession(0, null), 0);
    s = returnToFocus(s, 40 * S);
    expect(s.status).toBe("focusing");
    expect(s.strikes).toBe(1);
    expect(s.awayMs).toBe(30 * S);
  });

  it("fails on the third strike", () => {
    let s = startSession(0, null);
    let t = 0;
    for (let i = 0; i < 3; i++) {
      t += MIN;
      s = leave(s, t);
      t += 15 * S; // 5 s past grace each time
      s = returnToFocus(s, t);
    }
    expect(s.strikes).toBe(3);
    expect(s.status).toBe("failed");
  });

  it("fails once total away time reaches the limit", () => {
    const s = advance(leave(startSession(0, null), 0), 10 * MIN);
    expect(s.status).toBe("failed");
    expect(s.awayMs).toBe(MAX_AWAY_MS);
    expect(s.endedAt).toBe(GRACE_MS + MAX_AWAY_MS);
  });

  it("can complete inside the grace period", () => {
    let s = startSession(0, 25 * MIN);
    s = leave(s, 25 * MIN - 5 * S);
    s = advance(s, 25 * MIN + 3 * S);
    expect(s.status).toBe("completed");
    expect(s.focusedMs).toBe(25 * MIN);
  });
});

describe("ending", () => {
  it("completes an open-ended session", () => {
    expect(end(startSession(0, null), 20 * MIN).status).toBe("completed");
  });

  it("marks quitting a targeted session early as abandoned", () => {
    const s = end(startSession(0, 60 * MIN), 20 * MIN);
    expect(s.status).toBe("abandoned");
    expect(s.focusedMs).toBe(20 * MIN);
  });

  it("is a no-op on a finished session", () => {
    const done = end(startSession(0, null), MIN);
    expect(leave(done, 5 * MIN)).toBe(done);
    expect(end(done, 5 * MIN)).toBe(done);
  });
});

describe("stats", () => {
  it("ignores sessions under the minimum", () => {
    const s = end(startSession(0, null), MIN_COUNTED_MS - S);
    expect(countedMs(s)).toBe(0);
    expect(countsForStreak(s)).toBe(false);
  });

  it("counts failed sessions for hours but not the streak", () => {
    let s = startSession(0, null);
    s = leave(s, 12 * MIN);
    s = advance(s, 30 * MIN);
    expect(s.status).toBe("failed");
    expect(countedMs(s)).toBe(12 * MIN + GRACE_MS);
    expect(countsForStreak(s)).toBe(false);
  });

  it("keeps a streak for a completed session of enough length", () => {
    expect(countsForStreak(end(startSession(0, null), 30 * MIN))).toBe(true);
  });

  it("applies the daily cap", () => {
    const hour = 60 * MIN;
    expect(applyDailyCap(11 * hour, 3 * hour)).toBe(1 * hour);
    expect(applyDailyCap(12 * hour, hour)).toBe(0);
  });

  it("derives rank from hours", () => {
    const hour = 60 * MIN;
    expect(rankFor(0).current.name).toBe("Starter");
    expect(rankFor(10 * hour).current.name).toBe("Focused");
    expect(rankFor(49 * hour).next?.name).toBe("Dedicated");
    expect(rankFor(1200 * hour).next).toBeNull();
  });
});
