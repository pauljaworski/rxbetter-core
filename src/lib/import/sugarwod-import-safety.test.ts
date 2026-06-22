import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("SugarWOD import SQL safety", () => {
  it("does not delete athlete scores when replacing draft programming", () => {
    const generatedSql = readRepoFile("supabase/remote/05_triad_sugarwod_programming.sql");
    const script = readRepoFile("scripts/import-triad-sugarwod-programming.mjs");

    expect(generatedSql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    expect(script).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    expect(generatedSql).toContain("Refusing to replace Triad SugarWOD programming");
    expect(generatedSql).toMatch(
      /begin;\nalter table public\.programming disable trigger programming_update_guard;/i,
    );
    expect(generatedSql.trim()).toMatch(/commit;$/i);
  });

  it("does not delete athlete scores when reverting imported programming", () => {
    const revertSql = readRepoFile("supabase/remote/06_revert_triad_sugarwod_programming.sql");

    expect(revertSql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    expect(revertSql).toContain("Refusing to revert SugarWOD import");
    expect(revertSql).toMatch(/^-- Remove SugarWOD bulk import[\s\S]*\nbegin;\n/i);
    expect(revertSql.trim()).toMatch(/commit;$/i);
  });
});

describe("Triad seed auth safety", () => {
  it("does not seed repo-visible shared passwords", () => {
    const memberSeed = readRepoFile(
      "supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
    );
    const codySeed = readRepoFile("supabase/migrations/20260613160000_cody_houchin_auth.sql");

    expect(memberSeed).not.toContain(
      "extensions.crypt('TriadTrain2026!', extensions.gen_salt('bf'))",
    );
    expect(codySeed).not.toContain(
      "extensions.crypt('TriadTrain2026!', extensions.gen_salt('bf'))",
    );
  });
});
