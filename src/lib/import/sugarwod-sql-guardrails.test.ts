import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

function repoFile(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

describe("Triad import SQL guardrails", () => {
  it("does not commit shared seed auth credentials", () => {
    const seedMigration = repoFile("supabase/migrations/20260613150000_triad_members_personal_workouts.sql");
    const codyMigration = repoFile("supabase/migrations/20260613160000_cody_houchin_auth.sql");
    const rotationMigration = repoFile("supabase/migrations/20260628130500_rotate_triad_seed_auth_passwords.sql");

    for (const sql of [seedMigration, codyMigration, rotationMigration]) {
      expect(sql).not.toContain("TriadTrain2026");
    }

    expect(seedMigration).toContain("extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text");
    expect(codyMigration).toContain("extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text");
    expect(rotationMigration).toContain("brooke.n.webber@gmail.com");
    expect(rotationMigration).toContain("bobby@ftprehab.com");
    expect(rotationMigration).toContain("codyhouchin@outlook.com");
  });

  it("keeps SugarWOD import cleanup scoped and score-safe", () => {
    const importSql = repoFile("supabase/remote/05_triad_sugarwod_programming.sql");
    const revertSql = repoFile("supabase/remote/06_revert_triad_sugarwod_programming.sql");
    const generator = repoFile("scripts/import-triad-sugarwod-programming.mjs");

    for (const sql of [importSql, revertSql]) {
      expect(sql).toMatch(/\bbegin;\s+alter table public\.programming disable trigger/i);
      expect(sql).toMatch(/Refusing to (replace|remove) SugarWOD import rows that already have athlete scores/);
      expect(sql).toMatch(/alter table public\.programming_line_item enable trigger pli_update_guard;\s+commit;/i);
      expect(sql).not.toMatch(/delete from public\.athlete_performance/i);
    }

    expect(importSql).toMatch(/delete from public\.programming_library_assignment[\s\S]*id::text like 'e5000000%'/);
    expect(importSql).toMatch(/delete from public\.programming_line_item[\s\S]*id::text like 'e5000000%'/);
    expect(importSql).toMatch(/delete from public\.programming[\s\S]*id::text like 'e5000000%'/);

    expect(generator).not.toMatch(/delete from public\.athlete_performance/);
    expect(generator).toContain("p.id::text like 'e5000000%'");
    expect(generator).toContain("and id::text like 'e5000000%'");
    expect(generator).toContain("sql.push('commit;');");
  });
});
