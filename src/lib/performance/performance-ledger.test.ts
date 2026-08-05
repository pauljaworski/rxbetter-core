import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./performance-ledger";

describe("isUniqueViolation", () => {
  it("detects Postgres unique_violation code", () => {
    expect(isUniqueViolation({ code: "23505", message: "duplicate key value" })).toBe(true);
  });

  it("detects ledger index names in messages", () => {
    expect(
      isUniqueViolation({
        message: 'duplicate key value violates unique constraint "athlete_performance_contact_pli_uidx"',
      }),
    ).toBe(true);
    expect(
      isUniqueViolation({
        message: "athlete_performance_contact_segment_uidx",
      }),
    ).toBe(true);
    expect(
      isUniqueViolation({
        message: "athlete_performance_contact_group_date_uidx",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isUniqueViolation({ message: "JWT expired" })).toBe(false);
  });
});
