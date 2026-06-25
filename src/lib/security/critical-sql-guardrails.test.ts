import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("critical SQL guardrails", () => {
  it("scopes SugarWOD import cleanup to deterministic import ids", () => {
    const sql = readWorkspaceFile("supabase/remote/05_triad_sugarwod_programming.sql");
    const cleanupBlock = sql.slice(0, sql.indexOf("insert into public.programming"));

    expect(cleanupBlock).toContain("begin;");
    expect(cleanupBlock).toContain("p.id::text like 'e5000000%'");
    expect(cleanupBlock).not.toMatch(/delete from public\.programming\s+where gym_id/i);
    expect(cleanupBlock).not.toMatch(/wod_date\s*>=/i);
  });

  it("does not create seeded auth users with the committed shared password", () => {
    const triadSeed = readWorkspaceFile(
      "supabase/migrations/20260613150000_triad_members_personal_workouts.sql",
    );
    const codySeed = readWorkspaceFile(
      "supabase/migrations/20260613160000_cody_houchin_auth.sql",
    );

    expect(triadSeed).not.toContain("extensions.crypt('TriadTrain2026!'");
    expect(codySeed).not.toContain("extensions.crypt('TriadTrain2026!'");
  });

  it("keeps athlete-custom programming owner-scoped in the latest migration", () => {
    const sql = readWorkspaceFile(
      "supabase/migrations/20260625130500_lock_personal_programming_and_rotate_seed_passwords.sql",
    );

    expect(sql).toContain("source = 'gym'");
    expect(sql).toContain("source = 'athlete_custom'");
    expect(sql).toContain("created_by_contact_id = public.auth_contact_id ()");
    expect(sql).toContain("Only the owning athlete may update personal programming");
  });
});
