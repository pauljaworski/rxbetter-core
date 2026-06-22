import { describe, expect, it } from "vitest";
import { safeAuthRedirectPath } from "./Auth";

describe("safeAuthRedirectPath", () => {
  it("allows same-app absolute paths", () => {
    expect(safeAuthRedirectPath("/leaderboard?date=2026-06-22")).toBe(
      "/leaderboard?date=2026-06-22",
    );
  });

  it("rejects external or malformed next values", () => {
    expect(safeAuthRedirectPath("//evil.example/phishing")).toBe("/");
    expect(safeAuthRedirectPath("https://evil.example/phishing")).toBe("/");
    expect(safeAuthRedirectPath(null)).toBe("/");
  });
});
