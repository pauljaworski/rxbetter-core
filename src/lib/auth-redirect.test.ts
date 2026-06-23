import { describe, expect, it } from "vitest";
import { sanitizeAuthRedirectPath } from "./auth-redirect";

describe("sanitizeAuthRedirectPath", () => {
  it("allows same-app relative redirects", () => {
    expect(sanitizeAuthRedirectPath("/today?tab=wod#score")).toBe("/today?tab=wod#score");
  });

  it("rejects external redirects", () => {
    expect(sanitizeAuthRedirectPath("https://evil.example/phish")).toBe("/");
    expect(sanitizeAuthRedirectPath("//evil.example/phish")).toBe("/");
    expect(sanitizeAuthRedirectPath("/\\evil.example/phish")).toBe("/");
  });
});
