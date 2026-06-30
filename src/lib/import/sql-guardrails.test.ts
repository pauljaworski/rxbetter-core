import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const destructiveImportFiles = [
  "supabase/remote/04_triad_workout_trends.sql",
  "supabase/remote/05_triad_sugarwod_programming.sql",
  "supabase/remote/06_revert_triad_sugarwod_programming.sql",
  "scripts/import-triad-workout-trends.mjs",
  "scripts/import-triad-sugarwod-programming.mjs",
];

describe("SQL operational guardrails", () => {
  it("does not commit shared Triad seed auth passwords", () => {
    const seedSql = [
      "supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
      "supabase/migrations/20260613160000_cody_houchin_auth.sql",
    ]
      .map(readRepoFile)
      .join("\n");

    expect(seedSql).not.toContain("TriadTrain2026!");
    expect(seedSql).toContain("gen_random_uuid()::text");
  });

  it("keeps remote trigger disables inside explicit transactions", () => {
    const files = [
      "supabase/remote/04_triad_workout_trends.sql",
      "supabase/remote/05_cleanup_paul_fake_data.sql",
      "supabase/remote/05_triad_sugarwod_programming.sql",
      "supabase/remote/06_revert_triad_sugarwod_programming.sql",
    ];

    for (const file of files) {
      const sql = readRepoFile(file).toLowerCase();
      expect(sql).toMatch(/\bbegin;\s+alter table public\.programming disable trigger/);
      expect(sql.trim()).toMatch(/commit;$/);
    }
  });

  it("does not delete athlete score history in generated programming imports", () => {
    for (const file of destructiveImportFiles) {
      const sql = readRepoFile(file).toLowerCase();
      expect(sql).not.toMatch(/delete\s+from\s+public\.athlete_performance/);
      expect(sql).toMatch(/generated programming already has athlete scores/);
    }
  });

  it("scopes generated programming cleanup to fixture id prefixes", () => {
    const sugarwodSql = readRepoFile("supabase/remote/05_triad_sugarwod_programming.sql");
    expect(sugarwodSql).toMatch(/id::text like 'e5000000%'/);

    const trendsSql = readRepoFile("supabase/remote/04_triad_workout_trends.sql");
    expect(trendsSql).toMatch(/id::text like 'e3000000%'/);

    const paulCleanup = readRepoFile("supabase/remote/05_cleanup_paul_fake_data.sql").toLowerCase();
    expect(paulCleanup).not.toMatch(/delete\s+from\s+public\.athlete_performance/);
    expect(paulCleanup).not.toMatch(/delete\s+from\s+public\.athlete_benchmark_summary/);
  });

  it("keeps segment group completion uniqueness date-scoped", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260630131000_scope_segment_group_scores_by_date.sql",
    ).toLowerCase();

    expect(migration).toContain("drop index if exists public.athlete_segment_completion_group_uidx");
    expect(migration).toMatch(
      /athlete_segment_completion\s*\(\s*contact_id,\s*segment_group_id,\s*performance_date\s*\)/,
    );
  });
});
