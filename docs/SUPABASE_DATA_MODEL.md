# RxBetter — Supabase data model (what each object does)

This doc summarizes **`public`** tables from [`supabase/migrations/`](../supabase/migrations/) and their Salesforce lineage where applicable. The migration SQL remains the source of truth for columns and constraints.

| Postgres table | Purpose |
|----------------|---------|
| **gym** | Tenant / gym account; subscription status and plan (maps SF Account + subscription fields). |
| **contact** | A person (athlete, coach, owner); optional link to `auth.users` via `user_id`. |
| **profiles** | Bridge from Supabase Auth (`auth.users.id`) to a `contact` row for app identity. |
| **gym_onboarding_request** | Intake record while onboarding a new gym; may resolve to created `gym` + `contact`. |
| **program_library** | A programming track/library owned by a gym (templates and catalog). |
| **fitness_membership** | Person ↔ gym membership with **role** (`athlete`, `coach`, `programmer`, `admin`, `owner`). Multiple rows per (contact, gym) are **different roles** (additive personas). `head_coach` was renamed to **`programmer`**. |
| **athlete_subscription** | **Track access** or **library-scoped staff** entitlement. Column **`subscription_scope`**: `athlete_track` (default) = access programming for that `program_library_id` at `gym_id`; `staff_coach` / `staff_programmer` / `staff_admin` = staff role for that library at that gym (pairs with `fitness_membership` role). `program_library_id` **null** on a staff row = gym-wide staff entitlement for that scope. |
| **benchmark_type** | Global movement/benchmark category (e.g. strength vs metcon); SF `Programming_Type__c`. |
| **benchmark_definition** | Specific benchmark variant for a type (e.g. rep scheme / “1RM”); ties to `benchmark_type`. |
| **programming** | A scheduled workout/session (WOD block) with optional library link. **`gym_id`** nullable for athlete-only “personal” sessions off-tenant. **`created_by_contact_id`**: null = staff/programmer-authored (`source = 'gym'`); set = athlete-authored solo session (`source = 'athlete_custom'`). |
| **programming_line_item** | Prescribed sets/reps/movements within one `programming` row; optional **`contact_id`** for individualized lines. **`completed_at`** optional. **Class / shared prescription:** `contact_id` null — athletes **do not** update these rows for scores; they insert **`athlete_performance`** referencing `programming_line_item_id`. **Individualized** lines (`contact_id` = athlete) may still allow narrow result-field updates on the PLI. |
| **athlete_performance** | **Primary ledger for class WOD completion** when programming is shared: one row per athlete per completed piece, linking `contact_id`, optional `programming_id`, optional `programming_line_item_id`, scores/PR flags. Also used for custom workouts tied to gym or personal `programming`. |
| **athlete_benchmark_summary** | Rolling “current PR” style summary per athlete + benchmark definition. |

**Views**

- **benchmark_definition_display** — Human-readable benchmark labels (formula equivalent).
- **programming_with_counts** — Rollup-style counts for programming completion.

## Hybrid completion (shared WOD vs athlete-custom)

| Flow | Programming / PLI | Where results live |
|------|-------------------|---------------------|
| **Gym / programmer class WOD** | One `programming` + shared `programming_line_item` rows (`contact_id` null). Do not duplicate PLIs per athlete. | **`athlete_performance`** rows (reference `programming_id` / `programming_line_item_id`). Updating shared PLIs for scores is **blocked** by trigger — use the performance ledger. |
| **Athlete solo / custom** | Athlete inserts `programming` with `source = 'athlete_custom'`, `created_by_contact_id = self`, optional **`gym_id`** (Triad) or **`gym_id` null** for personal off-tenant sessions; adds `programming_line_item` rows under that session. | Same athlete may insert **`athlete_performance`** when logging outcomes; full edit of own custom PLIs while authoring the session. |

Further migration: `20260504120000_hybrid_completion_athlete_custom_programming.sql`.

## Personas & RLS (summary)

Row-level security is defined in migrations (`20260503120000_persona_rls_and_library_scope.sql`, `20260504120000_hybrid_completion_athlete_custom_programming.sql`). In short:

- **Athlete** — Updates own `contact` / `profiles`; may insert/update own `athlete_benchmark_summary`; inserts **`athlete_performance`** for class completion; may insert/update **own** `programming` / `programming_line_item` when `source = 'athlete_custom'` and `created_by_contact_id` matches; may update **only result fields** on **individualized** `programming_line_item` (`contact_id` = self), not on **shared** (`contact_id` null) lines.
- **Coach** — Same profile/contact self-service; may update **`programming.coaches_notes` only** on programming rows where they have **coach membership** + **`staff_coach`** subscription to that library; may update/correct **full** `programming_line_item` rows under the same library scope. Cannot create `programming` rows.
- **Programmer** — Create/update `program_library`, `programming`, `programming_line_item` where **programmer membership** + **`staff_programmer`** subscription matches (or gym-wide staff subscription when `program_library_id` is null).
- **Admin** — Same-gym **`is_gym_admin_scoped`**: **admin** membership + **`staff_admin`** subscription for that gym (any library row or gym-wide). Can maintain memberships/subscriptions, onboarding requests, global `benchmark_type` / `benchmark_definition`, and broad writes as defined in policies.

Bootstrapping the first users still typically uses the **service role** or SQL console where RLS is bypassed.
