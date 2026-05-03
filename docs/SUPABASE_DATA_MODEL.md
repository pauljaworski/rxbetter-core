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
| **programming** | A scheduled workout/session for a gym on a date (WOD block); optional library link. |
| **programming_line_item** | Prescribed sets/reps/movements within one `programming` row; optional athlete targeting. **`completed_at`** optional timestamp when the athlete marked completion. |
| **athlete_performance** | Historical performance log (completed work, scores, PR-related flags). |
| **athlete_benchmark_summary** | Rolling “current PR” style summary per athlete + benchmark definition. |

**Views**

- **benchmark_definition_display** — Human-readable benchmark labels (formula equivalent).
- **programming_with_counts** — Rollup-style counts for programming completion.

## Personas & RLS (summary)

Row-level security is defined in migrations (see `20260503120000_persona_rls_and_library_scope.sql`). In short:

- **Athlete** — Updates own `contact` / `profiles`; may insert/update own `athlete_benchmark_summary`; may update **only result fields** on `programming_line_item` (`actual_weight_lifted`, `prescribed_score`, `status`, `completed_at`) when they have **active athlete membership**, **athlete_track subscription** to that programming’s library (or gym-wide null library), and the line targets their `contact_id`. Other tables are read-only via policy or trigger guards.
- **Coach** — Same profile/contact self-service; may update **`programming.coaches_notes` only** on programming rows where they have **coach membership** + **`staff_coach`** subscription to that library; may update/correct **full** `programming_line_item` rows under the same library scope. Cannot create `programming` rows.
- **Programmer** — Create/update `program_library`, `programming`, `programming_line_item` where **programmer membership** + **`staff_programmer`** subscription matches (or gym-wide staff subscription when `program_library_id` is null).
- **Admin** — Same-gym **`is_gym_admin_scoped`**: **admin** membership + **`staff_admin`** subscription for that gym (any library row or gym-wide). Can maintain memberships/subscriptions, onboarding requests, global `benchmark_type` / `benchmark_definition`, and broad writes as defined in policies.

Bootstrapping the first users still typically uses the **service role** or SQL console where RLS is bypassed.
