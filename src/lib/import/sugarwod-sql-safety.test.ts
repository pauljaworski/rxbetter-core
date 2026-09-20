import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readRepoFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const generator = readRepoFile(
  "scripts/import-triad-sugarwod-programming.mjs",
);
const importSql = readRepoFile(
  "supabase/remote/05_triad_sugarwod_programming.sql",
);
const revertSql = readRepoFile(
  "supabase/remote/06_revert_triad_sugarwod_programming.sql",
);

describe("Triad SugarWOD SQL safety", () => {
  it.each([
    ["generator", generator],
    ["generated import", importSql],
    ["revert", revertSql],
  ])("%s never deletes athlete performance history", (_name, sql) => {
    expect(sql).not.toMatch(/delete\s+from\s+public\.athlete_performance/i);
  });

  it.each([
    ["generator", generator],
    ["generated import", importSql],
    ["revert", revertSql],
  ])("%s scopes every programming delete to import-owned IDs", (_name, sql) => {
    const deletes = sql.match(
      /delete\s+from\s+public\.(?:programming_library_assignment|programming_line_item|programming)\b[\s\S]*?;/gi,
    );

    expect(deletes).not.toBeNull();
    for (const statement of deletes ?? []) {
      expect(statement).toMatch(/id::text\s+like\s+'e5000000%'/i);
    }
  });

  it.each([
    ["generator", generator],
    ["generated import", importSql],
    ["revert", revertSql],
  ])("%s wraps trigger changes and writes in a transaction", (_name, sql) => {
    const begin = sql.search(/\bbegin;/i);
    const firstTriggerDisable = sql.search(/disable\s+trigger/i);
    const lastTriggerEnable = sql.toLowerCase().lastIndexOf("enable trigger");
    const commit = sql.search(/\bcommit;/i);

    expect(begin).toBeGreaterThanOrEqual(0);
    expect(begin).toBeLessThan(firstTriggerDisable);
    expect(lastTriggerEnable).toBeGreaterThan(firstTriggerDisable);
    expect(commit).toBeGreaterThan(lastTriggerEnable);
  });
});
