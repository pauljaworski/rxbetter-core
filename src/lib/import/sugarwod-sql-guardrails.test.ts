import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function expectTriggerChangesTransactional(sql: string) {
  const lower = sql.toLowerCase();
  const beginIndex = lower.indexOf("begin;");
  const disableIndex = lower.indexOf("disable trigger");
  const enableIndex = lower.lastIndexOf("enable trigger");
  const commitIndex = lower.lastIndexOf("commit;");

  expect(beginIndex).toBeGreaterThanOrEqual(0);
  expect(disableIndex).toBeGreaterThan(beginIndex);
  expect(enableIndex).toBeGreaterThan(disableIndex);
  expect(commitIndex).toBeGreaterThan(enableIndex);
}

describe("Triad SugarWOD SQL guardrails", () => {
  const importSql = readRepoFile("supabase/remote/05_triad_sugarwod_programming.sql");
  const revertSql = readRepoFile("supabase/remote/06_revert_triad_sugarwod_programming.sql");
  const generator = readRepoFile("scripts/import-triad-sugarwod-programming.mjs");

  it("wraps trigger disables in a transaction", () => {
    expectTriggerChangesTransactional(importSql);
    expectTriggerChangesTransactional(revertSql);
    expect(generator).toContain("begin;");
    expect(generator).toContain("commit;");
  });

  it("never deletes athlete score history during import or revert", () => {
    expect(importSql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    expect(revertSql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
    expect(generator).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
  });

  it("limits cleanup to deterministic SugarWOD import IDs", () => {
    expect(importSql).toMatch(/id::text\s+like\s+'e5000000%'/i);
    expect(revertSql).toMatch(/id::text\s+like\s+'e5000000%'/i);
    expect(generator).toContain("id::text like '${IMPORT_ID_PREFIX}%'");

    expect(importSql).not.toMatch(
      /delete\s+from\s+public\.programming\s+where\s+gym_id[\s\S]*source\s*=\s*'gym'\s*;/i,
    );
  });
});
