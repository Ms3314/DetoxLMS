import { describe, expect, it } from "vitest";
import type { SessionRecord } from "../focus/log";
import { recordToRow, rowToRecord, type SessionRow } from "./cloud";

const record: SessionRecord = {
  id: "abc123",
  startedAt: Date.UTC(2026, 10, 4, 10, 0, 0),
  endedAt: Date.UTC(2026, 10, 4, 10, 45, 0),
  targetMs: 45 * 60_000,
  focusedMs: 2_700_400,
  awayMs: 12_000,
  strikes: 1,
  status: "completed",
  playlistId: "PL123",
  videoId: "vid12345678",
  countedMs: 2_700_400,
};

describe("session mapping", () => {
  it("converts a record to a row in whole seconds", () => {
    const row = recordToRow("user-1", record);
    expect(row.user_id).toBe("user-1");
    expect(row.local_id).toBe("abc123");
    expect(row.focused_seconds).toBe(2700);
    expect(row.counted_seconds).toBe(2700);
    expect(row.target_seconds).toBe(2700);
    expect(row.started_at).toBe("2026-11-04T10:00:00.000Z");
  });

  it("never lets counted seconds exceed focused seconds after rounding", () => {
    const row = recordToRow("u", { ...record, focusedMs: 600_400, countedMs: 600_600 });
    expect(row.counted_seconds).toBeLessThanOrEqual(row.focused_seconds);
  });

  it("keeps an open-ended target as null", () => {
    expect(recordToRow("u", { ...record, targetMs: null }).target_seconds).toBeNull();
  });

  it("round-trips through a row", () => {
    const row = recordToRow("u", { ...record, focusedMs: 2_700_000, countedMs: 2_700_000, awayMs: 12_000 });
    const back = rowToRecord(row as unknown as SessionRow);
    expect(back).toMatchObject({
      id: "abc123",
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      focusedMs: 2_700_000,
      countedMs: 2_700_000,
      awayMs: 12_000,
      strikes: 1,
      status: "completed",
      targetMs: 2_700_000,
    });
  });
});
