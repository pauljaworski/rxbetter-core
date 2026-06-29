import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function repoFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("remote SQL guardrails", () => {
  it("keeps generated Triad imports scoped to generated programming ids", () => {
    const workoutTrends = repoFile("supabase/remote/04_triad_workout_trends.sql");
    const sugarWod = repoFile("supabase/remote/05_triad_sugarwod_programming.sql");

    expect(workoutTrends).toContain("begin;");
    expect(workoutTrends).toContain("commit;");
    expect(workoutTrends).toMatch(/delete from public\.programming[\s\S]*id::text like 'e3000000%'/);
    expect(workoutTrends).toMatch(/delete from public\.athlete_performance[\s\S]*id::text like 'e3000000%'/);

    expect(sugarWod).toContain("begin;");
    expect(sugarWod).toContain("commit;");
    expect(sugarWod).not.toMatch(/delete from public\.athlete_performance/i);
    expect(sugarWod).toMatch(/delete from public\.programming[\s\S]*id::text like 'e5000000%'/);
  });

  it("does not include contact-wide Paul performance cleanup", () => {
    const cleanup = repoFile("supabase/remote/05_cleanup_paul_fake_data.sql");
    expect(cleanup).toContain("begin;");
    expect(cleanup).toContain("commit;");
    expect(cleanup).not.toMatch(/delete from public\.athlete_performance\s+where contact_id/i);
    expect(cleanup).not.toMatch(/delete from public\.athlete_benchmark_summary\s+where contact_id/i);
  });

  it("does not seed auth users with the committed Triad password", () => {
    const triadMembers = repoFile(
      "supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
    );
    const codyAuth = repoFile("supabase/migrations/20260613160000_cody_houchin_auth.sql");

    expect(`${triadMembers}\n${codyAuth}`).not.toMatch(
      /extensions\.crypt\('TriadTrain2026!',\s*extensions\.gen_salt\('bf'\)\)/,
    );
  });
});
