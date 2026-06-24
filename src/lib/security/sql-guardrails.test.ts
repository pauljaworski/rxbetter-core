import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sqlFiles = {
  triadSeed: "supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
  codyAuth: "supabase/migrations/20260613160000_cody_houchin_auth.sql",
  passwordRotation: "supabase/migrations/20260624130500_rotate_committed_seed_passwords.sql",
  workoutTrends: "supabase/remote/04_triad_workout_trends.sql",
  paulCleanup: "supabase/remote/05_cleanup_paul_fake_data.sql",
  sugarwodImport: "supabase/remote/05_triad_sugarwod_programming.sql",
  sugarwodRevert: "supabase/remote/06_revert_triad_sugarwod_programming.sql",
} as const;

const triggerDisabledScripts = [
  sqlFiles.workoutTrends,
  sqlFiles.paulCleanup,
  sqlFiles.sugarwodImport,
  sqlFiles.sugarwodRevert,
];

function readSql(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("SQL security guardrails", () => {
  it("does not commit reusable seed account passwords", () => {
    for (const file of [sqlFiles.triadSeed, sqlFiles.codyAuth, sqlFiles.passwordRotation]) {
      expect(readSql(file)).not.toContain("TriadTrain2026!");
    }
  });

  it("preserves athlete scores when replacing SugarWOD programming scripts", () => {
    for (const file of [sqlFiles.sugarwodImport, sqlFiles.sugarwodRevert]) {
      expect(readSql(file)).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    }
  });

  it("wraps trigger-disabled remote scripts in a transaction", () => {
    for (const file of triggerDisabledScripts) {
      const sql = readSql(file);
      expect(sql).toMatch(/begin;\s+alter table public\.programming disable trigger programming_update_guard;/i);
      expect(sql).toMatch(/alter table public\.programming_line_item enable trigger pli_update_guard;\s+commit;/i);
    }
  });

  it("limits SugarWOD import cleanup to generated import programming ids", () => {
    const sql = readSql(sqlFiles.sugarwodImport);
    const cleanupPreamble = sql.slice(
      0,
      sql.indexOf("insert into public.programming (id, gym_id"),
    );
    const generatedIdFilters = cleanupPreamble.match(/p\.id::text like 'e5000000%'/g) ?? [];

    expect(generatedIdFilters).toHaveLength(3);
    expect(cleanupPreamble).not.toMatch(/delete from public\.programming p[\s\S]*p\.source = 'gym';/i);
  });

  it("limits Workout Trends cleanup to generated Paul fixture rows", () => {
    const sql = readSql(sqlFiles.workoutTrends);
    const cleanupPreamble = sql.slice(
      0,
      sql.indexOf("insert into public.programming (id, gym_id"),
    );

    expect(cleanupPreamble).toMatch(/delete from public\.athlete_performance[\s\S]*p\.id::text like 'e3000000%'[\s\S]*contact_id = 'c0000000-0000-4000-8000-000000000001'/i);
    expect(cleanupPreamble).toMatch(/delete from public\.programming p[\s\S]*p\.id::text like 'e3000000%'/i);
    expect(cleanupPreamble).not.toMatch(/delete from public\.programming p[\s\S]*p\.wod_date <= '2026-06-30';/i);
  });

  it("does not wipe all of Paul's imported history during cleanup", () => {
    const sql = readSql(sqlFiles.paulCleanup);

    expect(sql).not.toMatch(/delete from public\.athlete_performance\s+where contact_id = 'c0000000-0000-4000-8000-000000000001';/i);
    expect(sql).not.toMatch(/delete from public\.athlete_benchmark_summary\s+where contact_id = 'c0000000-0000-4000-8000-000000000001';/i);
  });
});
