# RxBetter — Supabase data model (what each object does)

This doc summarizes **`public`** tables from [`supabase/migrations/`](../supabase/migrations/) and their Salesforce lineage where applicable. The migration SQL remains the source of truth for columns and constraints.

| Postgres table | Purpose |
|----------------|---------|
| **gym** | Tenant / gym account; subscription status and plan (maps SF Account + subscription fields). |
| **contact** | A person (athlete, coach, owner); optional link to `auth.users` via `user_id`. |
| **profiles** | Bridge from Supabase Auth (`auth.users.id`) to a `contact` row for app identity. |
| **gym_onboarding_request** | Intake record while onboarding a new gym; may resolve to created `gym` + `contact`. |
| **program_library** | A programming track/library owned by a gym (templates and catalog). |
| **fitness_membership** | Person ↔ gym membership with **role** (athlete, coach, owner, …); enables multi-gym, multi-persona. |
| **athlete_subscription** | Entitlement: which athlete gets access to which program library (and gym); optional link to a membership row. |
| **benchmark_type** | Global movement/benchmark category (e.g. strength vs metcon); SF `Programming_Type__c`. |
| **benchmark_definition** | Specific benchmark variant for a type (e.g. rep scheme / “1RM”); ties to `benchmark_type`. |
| **programming** | A scheduled workout/session for a gym on a date (WOD block); optional library link. |
| **programming_line_item** | Prescribed sets/reps/movements within one `programming` row; optional athlete targeting. |
| **athlete_performance** | Historical performance log (completed work, scores, PR-related flags). |
| **athlete_benchmark_summary** | Rolling “current PR” style summary per athlete + benchmark definition. |

**Views**

- **benchmark_definition_display** — Human-readable benchmark labels (formula equivalent).
- **programming_with_counts** — Rollup-style counts for programming completion.
