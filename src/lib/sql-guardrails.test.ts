import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSql(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("operational SQL guardrails", () => {
  it("keeps SugarWOD import/revert scripts transactional and score-preserving", () => {
    for (const path of [
      "../../supabase/remote/05_triad_sugarwod_programming.sql",
      "../../supabase/remote/06_revert_triad_sugarwod_programming.sql",
    ]) {
      const sql = readSql(path);
      expect(sql).toMatch(/^begin;\s*$/m);
      expect(sql.trim()).toMatch(/commit;$/);
      expect(sql).toMatch(/already has athlete scores/);
      expect(sql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    }
  });

  it("keeps remote cleanup deletes constrained to deterministic fixture ids", () => {
    const trends = readSql("../../supabase/remote/04_triad_workout_trends.sql");
    expect(trends).toMatch(/^begin;\s*$/m);
    expect(trends.trim()).toMatch(/commit;$/);
    expect(trends).toMatch(/delete\s+from\s+public\.athlete_performance[\s\S]+id::text like 'e3000000%'/i);

    const paulCleanup = readSql("../../supabase/remote/05_cleanup_paul_fake_data.sql");
    expect(paulCleanup).toMatch(/^begin;\s*$/m);
    expect(paulCleanup.trim()).toMatch(/commit;$/);
    expect(paulCleanup).not.toMatch(/delete\s+from\s+public\.athlete_performance\s+where\s+contact_id/i);
    expect(paulCleanup).not.toMatch(/delete\s+from\s+public\.athlete_benchmark_summary\s+where\s+contact_id/i);
  });

  it("does not create seed auth users with the committed shared password", () => {
    for (const path of [
      "../../supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
      "../../supabase/migrations/20260613160000_cody_houchin_auth.sql",
    ]) {
      const sql = readSql(path);
      expect(sql).not.toMatch(/extensions\.crypt\('TriadTrain2026!'/);
      expect(sql).not.toMatch(/temp password TriadTrain2026!/);
    }
  });
});
