/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260703130500_lock_athlete_custom_programming_scope.sql",
  ),
  "utf8",
);

describe("athlete custom programming scope migration", () => {
  it("keeps staff programming policies scoped to gym-authored rows", () => {
    expect(migration).toContain("create policy programming_select on public.programming");
    expect(migration).toContain("source = 'gym'");
    expect(migration).toContain("source = 'athlete_custom'");
    expect(migration).toContain("created_by_contact_id = public.auth_contact_id ()");
  });

  it("blocks staff updates to athlete-owned programming and movements", () => {
    expect(migration).toContain("old.source = 'athlete_custom' or new.source = 'athlete_custom'");
    expect(migration).toContain("Only the owning athlete may update personal programming");
    expect(migration).toContain("v_old_source = 'athlete_custom' or v_source = 'athlete_custom'");
    expect(migration).toContain("Only the owning athlete may update personal programming movements");
  });
});
