# RxBetter — Supabase data model (what each object does)

This doc summarizes **`public`** tables from [`supabase/migrations/`](../supabase/migrations/) and their Salesforce lineage where applicable. The migration SQL remains the source of truth for columns and constraints.

| Postgres table | Purpose |
|----------------|---------|
| **gym** | Tenant / gym account; subscription status and plan (maps SF Account + subscription fields). |
| **contact** | A person (athlete, coach, owner); optional link to `auth.users` via `user_id`. |
| **profiles** | Bridge from Supabase Auth (`auth.users.id`) to a `contact` row for app identity. Created automatically with **`contact`** when a row is inserted into **`auth.users`** (trigger `on_auth_user_created` → `handle_new_user`). Optional **`last_active_gym_id`** / **`last_active_gym_at`** for Global Identity Router default gym. |
| **membership_offering** | Sellable gym product, e.g. `Group Class`, `Open Gym`, `24/7 Access`. |
| **membership_offering_term** | One sellable term per offering, e.g. 1/3/6/12 month commitment and its quoted monthly price. |
| **membership_offering_component** | Maps one offering to benefits: one or more **`program_library`** rows and/or non-library capability codes like `open_gym` / `access_24_7`. |
| **athlete_offering_subscription** | Commercial snapshot of what an athlete bought: offering term, sold price, start/end dates, status, and originating link. |
| **contact_gym_capability_grant** | Capability entitlement ledger for non-library benefits (currently `open_gym` and `access_24_7`). |
| **fitness_track_link** | Productized invite URL (token = row `id`): gym admin defines allowed **`membership_offering_term`** options; athlete opens link, picks a sellable option, and **`claim_fitness_track_link`** creates commercial + entitlement rows. |
| **fitness_track_link_option** | Rows linking a **`fitness_track_link`** to a **`membership_offering_term_id`**; trigger enforces the term’s offering belongs to the link’s **`gym_id`**. |
| **gym_onboarding_request** | Intake record while onboarding a new gym; may resolve to created `gym` + `contact`. |
| **program_library** | A programming track/library owned by a gym (templates and catalog). |
| **fitness_membership** | Person ↔ gym membership with **role** (`athlete`, `coach`, `programmer`, `admin`, `owner`). Multiple rows per (contact, gym) are **different roles** (additive personas). `head_coach` was renamed to **`programmer`**. |
| **athlete_subscription** | **Track access** or **library-scoped staff** entitlement. Column **`subscription_scope`**: `athlete_track` (default) = access programming for that `program_library_id` at `gym_id`; `staff_coach` / `staff_programmer` / `staff_admin` = staff role for that library at that gym (pairs with `fitness_membership` role). `program_library_id` **must be non-null** for `athlete_track`; `program_library_id` **null** is reserved for gym-wide staff entitlement. |
| **benchmark_type** | Global movement/benchmark category (e.g. strength vs metcon); SF `Programming_Type__c`. |
| **benchmark_definition** | Specific benchmark variant for a type (e.g. rep scheme / “1RM”); ties to `benchmark_type`. |
| **programming** | A scheduled workout/session (WOD block) with optional library link. **`published_at`**: null = draft (staff only); set = visible to athletes. **`gym_id`** nullable for athlete-only “personal” sessions off-tenant. **`created_by_contact_id`**: null = staff/programmer-authored (`source = 'gym'`); set = athlete-authored solo session (`source = 'athlete_custom'`). **`program_library_id`** is the primary track (first selected library); additional tracks use **`programming_library_assignment`**. |
| **programming_library_assignment** | Junction: one `programming` row published to many **`program_library`** tracks (e.g. CrossFit + Hyrox). Backfilled from legacy `program_library_id`. |
| **programming_intake_stage** | Staging for plain-text WOD intake: `raw_text`, `parsed_payload` (JSON, optional `_meta` for AI model/tokens), `parser_mode` (`regex` / `llm` / `manual`), `token_count`, `latency_ms`, `status` (`staged` / `committed` / `rejected`), optional `committed_programming_id`. Phase 2 AI parse via edge function `parse-complex-wod` (OpenRouter). |
| **programming_line_item** | Prescribed sets/reps/movements within one `programming` row; optional **`contact_id`** for individualized lines. **`benchmark_definition_id`** ties % prescriptions to a rep max (1RM, 2RM, etc.). **`movement_label`** when **`benchmark_type_id`** is null (custom gym movement). **`completed_at`** optional. **Class / shared prescription:** `contact_id` null — athletes **do not** update these rows for scores; they insert **`athlete_performance`** referencing `programming_line_item_id` or segment-level `programming_id` for metcon time. **Individualized** lines (`contact_id` = athlete) may still allow narrow result-field updates on the PLI. |
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

## Sign-up / sign-in (Auth → contact + profiles)

1. The app calls Supabase Auth (`signUp` / OAuth). Any optional **`user_metadata`** / signup **`data`** (e.g. `first_name`, `last_name`, `full_name`) is stored on `auth.users.raw_user_meta_data`.
2. After insert into **`auth.users`**, the trigger **`on_auth_user_created`** runs **`public.handle_new_user`**, which inserts **`public.contact`** (`user_id`, `email`, names from metadata) then **`public.profiles`** (`id` = auth uid, `contact_id`, `display_name` derived from metadata or email local-part).
3. Client helpers live under **`src/lib/auth.ts`** (`signUpWithEmail`, `signInWithEmail`, `signOut`, `onAuthStateChange`). Env vars: **`NEXT_PUBLIC_SUPABASE_*`** or **`VITE_SUPABASE_*`** (see **`src/lib/supabase.ts`**).

Migration: `20260510120000_auth_signup_contact_profile.sql`.

## Global Identity Router (Personal vs Gym mode)

- **Active gym set** — Use **`public.user_gym_ids()`** (and/or query **`fitness_membership`** with `membership_status = 'active'` for the current **`profiles.contact_id`**) to decide mode. Empty set ⇒ **Personal mode** (benchmarks / PRs / personal programming). Non-empty ⇒ **Gym mode** with a **gym switcher** list.
- **Default gym** — If **`profiles.last_active_gym_id`** is set and still in the active membership gym set, use it; otherwise use the gym with the latest **`fitness_membership.updated_at`** (tie-break **`created_at`**).
- **Client module** — [`src/lib/identity-router.ts`](../src/lib/identity-router.ts): `loadIdentityContext`, `resolveIdentityFromMemberships`, `setLastActiveGym`.

Migration: `20260511120000_global_identity_router_track_links.sql`.

## Membership offerings (commercial layer)

- **`membership_offering`** = what the gym sells.
- **`membership_offering_term`** = 1/3/6/12 month term + quoted monthly price.
- **`membership_offering_component`** = how a sold offering fans out into access:
  - `program_library` components create/update **`athlete_subscription`** rows.
  - `capability` components create/update **`contact_gym_capability_grant`** rows.
- **`athlete_offering_subscription`** stores the sold term snapshot separately from entitlements so pricing/term history is preserved even if access rows are later reactivated/adjusted.

Triad example:

- `Group Class` -> `CrossFit` + `Hyrox`
- `Open Gym` -> `open_gym`
- `24/7 Access` -> `access_24_7`

Migration: `20260513161000_membership_offerings_and_term_links.sql`.

## Productized track links (RPC)

- **`get_fitness_track_link_public(p_link_id uuid)`** — `SECURITY DEFINER`; **`anon` + `authenticated`** may execute. Returns JSON (`gym_name`, sellable term `options[]`, included libraries/capabilities, price metadata) or **`null`** if missing, revoked, or expired. No direct public RLS on link tables.
- **`claim_fitness_track_link(p_link_id, p_membership_offering_term_id)`** — `SECURITY DEFINER`; **`authenticated`** only. Validates option, ensures athlete **`fitness_membership`**, creates/reactivates **`athlete_offering_subscription`**, then fans out entitlements into **`athlete_subscription`** and **`contact_gym_capability_grant`**. Increments **`fitness_track_link.redemption_count`** only when a **new** membership / commercial row / entitlement row is inserted (not pure reactivation updates).
- **Client** — [`src/lib/track-links.ts`](../src/lib/track-links.ts).

Gym staff create links via normal inserts into **`fitness_track_link`** / **`fitness_track_link_option`** under **`is_gym_admin_scoped`** RLS.
