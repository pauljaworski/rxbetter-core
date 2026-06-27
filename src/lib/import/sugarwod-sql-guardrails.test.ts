import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

describe("SugarWOD SQL guardrails", () => {
  const importSql = readRepoFile("supabase/remote/05_triad_sugarwod_programming.sql");
  const revertSql = readRepoFile("supabase/remote/06_revert_triad_sugarwod_programming.sql");
  const generator = readRepoFile("scripts/import-triad-sugarwod-programming.mjs");

  it("does not delete athlete scores during import or revert cleanup", () => {
    for (const sql of [importSql, revertSql, generator]) {
      expect(sql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    }
  });

  it("scopes programming cleanup to deterministic SugarWOD import ids", () => {
    expect(importSql).toMatch(/delete\s+from\s+public\.programming\s+where[\s\S]*id::text like 'e5000000%'/i);
    expect(revertSql).toMatch(/delete\s+from\s+public\.programming\s+where[\s\S]*id::text like 'e5000000%'/i);
    expect(generator).toMatch(/delete from public\.programming where[\s\S]*id::text like 'e5000000%'/i);
  });

  it("fails closed before removing imported programming with logged scores", () => {
    for (const sql of [importSql, revertSql, generator]) {
      expect(sql).toMatch(/if exists \([\s\S]*from public\.athlete_performance ap[\s\S]*id::text like 'e5000000%'/i);
      expect(sql).toMatch(/Refusing to (refresh|revert) SugarWOD import because imported programming already has athlete scores/);
    }
  });

  it("keeps trigger disables inside transactions", () => {
    for (const sql of [importSql, revertSql, generator]) {
      expect(sql).toMatch(/begin;/i);
      expect(sql).toMatch(/disable trigger programming_update_guard/i);
      expect(sql).toMatch(/enable trigger programming_update_guard/i);
      expect(sql).toMatch(/commit;/i);
    }
  });
});

describe("seed auth guardrails", () => {
  it("does not commit the old shared Triad seed password", () => {
    const seedMigration = readRepoFile("supabase/migrations/20260613150000_triad_members_personal_workouts.sql");
    const codyMigration = readRepoFile("supabase/migrations/20260613160000_cody_houchin_auth.sql");
    const rotationMigration = readRepoFile("supabase/migrations/20260627130500_rotate_committed_seed_passwords.sql");

    for (const sql of [seedMigration, codyMigration, rotationMigration]) {
      expect(sql).not.toMatch(/TriadTrain2026!/);
    }
  });
});
