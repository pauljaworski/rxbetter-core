-- =============================================================================
-- Harden RLS: immutable ownership FKs, leaderboard gym binding, commercial SELECT
-- =============================================================================
-- Fixes (main at a4a1762; not covered by draft PRs #1–#47):
-- 1. Admin (or any updater) could reparent athlete_performance.contact_id /
--    athlete_benchmark_summary.contact_id because UPDATE WITH CHECK only validates
--    the NEW contact_id against admin scope.
-- 2. leaderboard_like / leaderboard_comment INSERT only required gym_id ∈ user_gym_ids,
--    not that performance_id belongs to that gym.
-- 3. leaderboard_comment UPDATE only locked contact_id — author could reparent
--    gym_id / performance_id across gyms.
-- 4. profiles UPDATE allowed changing contact_id (identity bridge spoof / break).
-- 5. athlete_offering_subscription (+ capability grants) SELECT exposed sold prices
--    and commercial rows to every gym peer via user_gym_ids().
-- 6. fitness_membership UPDATE could reparent contact_id / gym_id while keeping
--    admin WITH CHECK on the destination gym.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers: performance belongs to gym (class WOD or active member of that gym)
-- ---------------------------------------------------------------------------
create or replace function public.athlete_performance_belongs_to_gym (
  p_performance_id uuid,
  p_gym_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_performance ap
    where ap.id = p_performance_id
      and (
        exists (
          select 1
          from public.programming p
          where p.id = ap.programming_id
            and p.gym_id = p_gym_id
        )
        or exists (
          select 1
          from public.fitness_membership fm
          where fm.contact_id = ap.contact_id
            and fm.gym_id = p_gym_id
            and fm.membership_status = 'active'
        )
      )
  );
$$;

comment on function public.athlete_performance_belongs_to_gym (uuid, uuid) is
  'True when a performance is tied to gym programming or the athlete is an active member of that gym.';

revoke all on function public.athlete_performance_belongs_to_gym (uuid, uuid) from public;
grant execute on function public.athlete_performance_belongs_to_gym (uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Immutable FK triggers
-- ---------------------------------------------------------------------------
create or replace function public.trg_lock_athlete_performance_ownership ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'athlete_performance.contact_id is immutable';
  end if;
  if new.programming_id is distinct from old.programming_id then
    raise exception 'athlete_performance.programming_id is immutable';
  end if;
  if new.programming_line_item_id is distinct from old.programming_line_item_id then
    raise exception 'athlete_performance.programming_line_item_id is immutable';
  end if;
  if new.segment_group_id is distinct from old.segment_group_id then
    raise exception 'athlete_performance.segment_group_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists athlete_performance_ownership_guard on public.athlete_performance;
create trigger athlete_performance_ownership_guard
  before update on public.athlete_performance
  for each row execute procedure public.trg_lock_athlete_performance_ownership ();

create or replace function public.trg_lock_athlete_benchmark_summary_ownership ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'athlete_benchmark_summary.contact_id is immutable';
  end if;
  if new.benchmark_definition_id is distinct from old.benchmark_definition_id then
    raise exception 'athlete_benchmark_summary.benchmark_definition_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists athlete_benchmark_summary_ownership_guard on public.athlete_benchmark_summary;
create trigger athlete_benchmark_summary_ownership_guard
  before update on public.athlete_benchmark_summary
  for each row execute procedure public.trg_lock_athlete_benchmark_summary_ownership ();

create or replace function public.trg_lock_profiles_contact_id ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'profiles.contact_id is immutable';
  end if;
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_contact_id_guard on public.profiles;
create trigger profiles_contact_id_guard
  before update on public.profiles
  for each row execute procedure public.trg_lock_profiles_contact_id ();

create or replace function public.trg_lock_fitness_membership_identity ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'fitness_membership.contact_id is immutable';
  end if;
  if new.gym_id is distinct from old.gym_id then
    raise exception 'fitness_membership.gym_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists fitness_membership_identity_guard on public.fitness_membership;
create trigger fitness_membership_identity_guard
  before update on public.fitness_membership
  for each row execute procedure public.trg_lock_fitness_membership_identity ();

create or replace function public.trg_lock_athlete_offering_subscription_identity ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'athlete_offering_subscription.contact_id is immutable';
  end if;
  if new.gym_id is distinct from old.gym_id then
    raise exception 'athlete_offering_subscription.gym_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists athlete_offering_subscription_identity_guard
  on public.athlete_offering_subscription;
create trigger athlete_offering_subscription_identity_guard
  before update on public.athlete_offering_subscription
  for each row execute procedure public.trg_lock_athlete_offering_subscription_identity ();

create or replace function public.trg_lock_leaderboard_comment_anchors ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.contact_id is distinct from old.contact_id then
    raise exception 'leaderboard_comment.contact_id is immutable';
  end if;
  if new.gym_id is distinct from old.gym_id then
    raise exception 'leaderboard_comment.gym_id is immutable';
  end if;
  if new.performance_id is distinct from old.performance_id then
    raise exception 'leaderboard_comment.performance_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists leaderboard_comment_anchors_guard on public.leaderboard_comment;
create trigger leaderboard_comment_anchors_guard
  before update on public.leaderboard_comment
  for each row execute procedure public.trg_lock_leaderboard_comment_anchors ();

-- ---------------------------------------------------------------------------
-- leaderboard_like / leaderboard_comment: bind gym_id to performance
-- ---------------------------------------------------------------------------
drop policy if exists leaderboard_like_insert on public.leaderboard_like;
create policy leaderboard_like_insert on public.leaderboard_like
  for insert with check (
    contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
    and public.athlete_performance_belongs_to_gym (performance_id, gym_id)
  );

drop policy if exists leaderboard_comment_insert on public.leaderboard_comment;
create policy leaderboard_comment_insert on public.leaderboard_comment
  for insert with check (
    contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
    and public.athlete_performance_belongs_to_gym (performance_id, gym_id)
  );

drop policy if exists leaderboard_comment_update on public.leaderboard_comment;
create policy leaderboard_comment_update on public.leaderboard_comment
  for update using (contact_id = public.auth_contact_id ())
  with check (
    contact_id = public.auth_contact_id ()
    and public.athlete_performance_belongs_to_gym (performance_id, gym_id)
  );

-- ---------------------------------------------------------------------------
-- Commercial SELECT: self or gym admin only (not every peer member)
-- ---------------------------------------------------------------------------
drop policy if exists athlete_offering_subscription_select on public.athlete_offering_subscription;
create policy athlete_offering_subscription_select on public.athlete_offering_subscription
  for select using (
    contact_id = public.auth_contact_id ()
    or public.is_gym_admin_scoped (gym_id)
  );

drop policy if exists contact_gym_capability_grant_select on public.contact_gym_capability_grant;
create policy contact_gym_capability_grant_select on public.contact_gym_capability_grant
  for select using (
    contact_id = public.auth_contact_id ()
    or public.is_gym_admin_scoped (gym_id)
  );
