import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("remote SQL guardrails", () => {
  it("scopes SugarWOD import cleanup to generated import IDs", () => {
    const sql = read("supabase/remote/05_triad_sugarwod_programming.sql");

    expect(sql).toContain("begin;");
    expect(sql).toContain("commit;");
    expect(sql.match(/id::text like 'e5000000%'/g)?.length).toBeGreaterThanOrEqual(4);
    expect(sql).not.toMatch(/delete from public\.programming where gym_id[\s\S]*source = 'gym';/);
  });

  it("scopes Workout Trends cleanup to generated import IDs", () => {
    const sql = read("supabase/remote/04_triad_workout_trends.sql");

    expect(sql).toContain("begin;");
    expect(sql).toContain("commit;");
    expect(sql.match(/id::text like 'e3000000%'/g)?.length).toBeGreaterThanOrEqual(3);
    expect(sql).not.toMatch(/delete from public\.programming where gym_id[\s\S]*wod_date <= '2026-06-30';/);
  });

  it("does not delete Paul history or the Triad tenant in cleanup scripts", () => {
    const paulCleanup = read("supabase/remote/05_cleanup_paul_fake_data.sql");
    const triadCleanup = read("supabase/remote/00_cleanup_triad_test.sql");

    expect(paulCleanup).not.toMatch(/delete from public\.athlete_performance\s+where contact_id =/);
    expect(paulCleanup).not.toMatch(/delete from public\.athlete_benchmark_summary\s+where contact_id =/);
    expect(triadCleanup).not.toMatch(/delete from public\.gym/);
    expect(triadCleanup).not.toMatch(/delete from public\.contact\s+where id::text like 'c0000000%'/);
  });

  it("does not create seeded auth users with the committed password", () => {
    const triadMembers = read("supabase/migrations/20260613150000_triad_members_personal_workouts.sql");
    const codyAuth = read("supabase/migrations/20260613160000_cody_houchin_auth.sql");

    expect(`${triadMembers}\n${codyAuth}`).not.toContain(
      "extensions.crypt('TriadTrain2026!', extensions.gen_salt('bf'))",
    );
  });
});
