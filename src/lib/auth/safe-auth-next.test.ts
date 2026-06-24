import { describe, expect, it } from "vitest";
import { getSafeAuthNext } from "./safe-auth-next";

describe("getSafeAuthNext", () => {
  it("keeps in-app redirect targets", () => {
    expect(getSafeAuthNext("/today")).toBe("/today");
    expect(getSafeAuthNext("/join/link-123?track=hyrox#claim")).toBe("/join/link-123?track=hyrox#claim");
  });

  it("rejects crafted external redirect targets", () => {
    expect(getSafeAuthNext("//evil.example/phish")).toBe("/");
    expect(getSafeAuthNext("https://evil.example/phish")).toBe("/");
    expect(getSafeAuthNext("  //evil.example/phish")).toBe("/");
    expect(getSafeAuthNext(null)).toBe("/");
  });
});
