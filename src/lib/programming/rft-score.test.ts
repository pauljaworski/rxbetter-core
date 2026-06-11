import { describe, expect, it } from "vitest";
import {
  buildRftScoreMeta,
  deriveRftWorkingTime,
  formatSecondsToMmSs,
  rftRestTotalSec,
  roundInputsFromMeta,
} from "./rft-score";

describe("rft-score", () => {
  it("computes prescribed rest total", () => {
    expect(rftRestTotalSec(5, 60)).toBe(240);
    expect(rftRestTotalSec(1, 60)).toBe(0);
  });

  it("derives total working time from per-round splits", () => {
    const out = deriveRftWorkingTime(5, 60, ["3:45", "3:38", "3:35", "3:32", "3:30"]);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.entryMode).toBe("splits");
    expect(out.result.workingTimeSec).toBe(225 + 218 + 215 + 212 + 210);
    expect(out.result.restTotalSec).toBe(240);
  });

  it("derives working time from total in last round only", () => {
    const out = deriveRftWorkingTime(5, 60, ["", "", "", "", "18:00"]);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.entryMode).toBe("total_in_last_round");
    expect(out.result.workingTimeSec).toBe(18 * 60);
  });

  it("rejects partial splits when an early round is filled", () => {
    const out = deriveRftWorkingTime(5, 60, ["3:45", "3:38", "", "", ""]);
    expect(out.ok).toBe(false);
  });

  it("builds score_meta and round inputs", () => {
    const derived = deriveRftWorkingTime(3, 60, ["", "", "10:00"]);
    expect(derived.ok).toBe(true);
    if (!derived.ok) return;
    const meta = buildRftScoreMeta(3, 60, derived.result);
    expect(meta.derived.workingTimeSec).toBe(600);
    expect(roundInputsFromMeta(meta, 3)).toEqual(["", "", "10:00"]);
    expect(formatSecondsToMmSs(600)).toBe("10:00");
  });
});
