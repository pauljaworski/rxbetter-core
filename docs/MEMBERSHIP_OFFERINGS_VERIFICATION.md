# Membership Offerings Verification

This checklist verifies the current auth + identity router + membership offering flow for the seeded `Triad Training` scenario.

## Seed/setup

Local resets now load both:

- `supabase/seed.sql`
- `supabase/test_data.sql`

because [`supabase/config.toml`](../supabase/config.toml) includes both files under `[db.seed].sql_paths`.

## Seeded Triad scenario

The Triad fixture includes:

- Gym: `Triad Training`
- Libraries: `CrossFit`, `Hyrox`
- Offerings: `Group Class`, `Open Gym`, `24/7 Access`
- Terms: `1 / 3 / 6 / 12` month commitments
- Links:
  - `Triad Group Class Enrollment`
  - `Triad Open Gym Enrollment`
  - `Triad 24/7 Access Enrollment`
  - `Triad Membership Picker`
- Athletes:
  - `Paul` = Group Class only
  - `Brooke` = Group Class + Open Gym
  - `Jordan` = Open Gym only
  - `Casey` = 24/7 Access only
  - `Taylor` = all three

## Database smoke checks

Run these after a local `supabase db reset` or against a linked database where the Triad fixture has been loaded.

### 1. Offerings and term pricing

```sql
select
  mo.name,
  mot.term_months,
  mot.price_cents,
  mot.currency
from public.membership_offering mo
join public.membership_offering_term mot
  on mot.membership_offering_id = mo.id
join public.gym g
  on g.id = mo.gym_id
where g.name = 'Triad Training'
order by mo.name, mot.term_months;
```

Expected:

- `Group Class`: `25000 / 23500 / 22500 / 20500`
- `Open Gym`: `15000 / 13500 / 12500 / 10500`
- `24/7 Access`: `17500 / 15500 / 14500 / 12500`

### 2. Group Class bundles both libraries

```sql
select
  mo.name as offering_name,
  moc.component_type,
  pl.name as program_library_name,
  moc.capability_code
from public.membership_offering mo
join public.membership_offering_component moc
  on moc.membership_offering_id = mo.id
left join public.program_library pl
  on pl.id = moc.program_library_id
where mo.name in ('Group Class', 'Open Gym', '24/7 Access')
order by mo.name, moc.component_type, pl.name, moc.capability_code;
```

Expected:

- `Group Class` => `CrossFit`, `Hyrox`
- `Open Gym` => capability `open_gym`
- `24/7 Access` => capability `access_24_7`

### 3. Track links expose sellable terms

```sql
select
  l.label,
  mo.name as offering_name,
  mot.term_months,
  mot.price_cents
from public.fitness_track_link l
join public.fitness_track_link_option lo
  on lo.link_id = l.id
join public.membership_offering_term mot
  on mot.id = lo.membership_offering_term_id
join public.membership_offering mo
  on mo.id = mot.membership_offering_id
order by l.label, mo.name, mot.term_months;
```

Expected:

- One link per offering
- `Triad Membership Picker` includes a 3-month option from all three offerings

### 4. Seeded athlete combinations

```sql
select
  c.first_name,
  c.last_name,
  mo.name as offering_name,
  mot.term_months,
  aos.start_date,
  aos.end_date
from public.athlete_offering_subscription aos
join public.contact c
  on c.id = aos.contact_id
join public.membership_offering mo
  on mo.id = aos.membership_offering_id
join public.membership_offering_term mot
  on mot.id = aos.membership_offering_term_id
order by c.first_name, mo.name;
```

Expected:

- `Paul` => Group Class
- `Brooke` => Group Class + Open Gym
- `Jordan` => Open Gym
- `Casey` => 24/7 Access
- `Taylor` => Group Class + Open Gym + 24/7 Access

### 5. Non-library capability grants

```sql
select
  c.first_name,
  c.last_name,
  g.capability_code,
  g.start_date,
  g.end_date
from public.contact_gym_capability_grant g
join public.contact c
  on c.id = g.contact_id
order by c.first_name, g.capability_code;
```

Expected:

- `Brooke`, `Jordan`, `Taylor` have `open_gym`
- `Casey`, `Taylor` have `access_24_7`

## App/manual flow checks

### A. Signup bootstrap

1. Create a brand-new auth user through the app.
2. Confirm:
   - a `public.contact` row was created
   - a `public.profiles` row exists with `id = auth.users.id`
3. Because the new user has no active `fitness_membership`, the app should resolve to **Personal mode**.

### B. Link claim -> Gym mode

1. Open a Triad link landing page.
2. Call [`src/lib/track-links.ts`](../src/lib/track-links.ts):
   - `getFitnessTrackLinkPublic(...)`
   - `claimFitnessTrackLink(...)`
3. After claim, confirm:
   - `fitness_membership` exists / is active
   - `athlete_offering_subscription` exists
   - `athlete_subscription` rows exist for any bundled libraries
   - `contact_gym_capability_grant` rows exist for any capability components
4. Call [`src/lib/identity-router.ts`](../src/lib/identity-router.ts) `loadIdentityContext(...)`.
5. The same user should now resolve to **Gym mode** and see `Triad Training` in the gym switcher.

### C. Default gym persistence

1. When a member enters a gym shell, call `setLastActiveGym(...)`.
2. Confirm `profiles.last_active_gym_id` / `last_active_gym_at` update.
3. On next session load, `loadIdentityContext(...)` should choose that gym as `defaultGymId` if the membership is still active.

## What was validated during implementation

- Remote migration push succeeded with the offering schema + term-based claim flow.
- Type generation succeeded after the new schema was added.

If local Docker/Supabase is available, run a full `supabase db reset` to validate the fixture file itself end-to-end on a clean local database.
