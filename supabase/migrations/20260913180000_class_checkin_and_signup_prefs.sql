-- Persist athlete class check-ins (Calendar "log into a class").
create table if not exists public.athlete_class_checkin (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gym (id) on delete cascade,
  contact_id uuid not null references public.contact (id) on delete cascade,
  class_date date not null,
  start_time time not null,
  label text not null,
  class_type text,
  duration_min int not null default 60,
  created_at timestamptz not null default now(),
  unique (gym_id, contact_id, class_date, start_time)
);

comment on table public.athlete_class_checkin is
  'Athlete checked into a class time on a given day (for schedule + score logging context).';

create index if not exists athlete_class_checkin_day_idx
  on public.athlete_class_checkin (gym_id, class_date);

create index if not exists athlete_class_checkin_contact_day_idx
  on public.athlete_class_checkin (contact_id, class_date);

alter table public.athlete_class_checkin enable row level security;

create policy athlete_class_checkin_select on public.athlete_class_checkin
  for select using (
    gym_id in (select public.user_gym_ids ())
  );

create policy athlete_class_checkin_insert on public.athlete_class_checkin
  for insert with check (
    contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
  );

create policy athlete_class_checkin_delete on public.athlete_class_checkin
  for delete using (
    contact_id = public.auth_contact_id ()
  );

create policy athlete_class_checkin_staff_all on public.athlete_class_checkin
  for all using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.gym_id = athlete_class_checkin.gym_id
        and fm.contact_id = public.auth_contact_id ()
        and fm.role in ('admin', 'coach', 'programmer')
        and fm.membership_status = 'active'
    )
  );

-- Signup: store Rx prefs from auth metadata onto contact.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_contact_id uuid;
  meta             jsonb;
  fn               text;
  ln               text;
  disp             text;
  rg               text;
  dws              text;
  wu               text;
  tz               text;
begin
  meta := coalesce (new.raw_user_meta_data, '{}'::jsonb);
  fn := nullif (trim (coalesce (meta->>'first_name', meta->>'given_name')), '');
  ln := nullif (trim (coalesce (meta->>'last_name', meta->>'family_name')), '');
  disp := nullif (trim (coalesce (meta->>'full_name', meta->>'name')), '');
  rg := nullif (trim (coalesce (meta->>'rx_gender', '')), '');
  dws := nullif (trim (coalesce (meta->>'default_workout_scale', '')), '');
  wu := nullif (trim (coalesce (meta->>'weight_unit', '')), '');
  tz := nullif (trim (coalesce (meta->>'timezone', '')), '');

  if rg is not null and rg not in ('male', 'female') then
    rg := null;
  end if;
  if dws is not null and dws not in ('rx_plus', 'rx', 'fx', 'scaled') then
    dws := null;
  end if;
  if wu is not null and wu not in ('lb', 'kg') then
    wu := 'lb';
  end if;

  if disp is null and (fn is not null or ln is not null) then
    disp := trim (coalesce (fn || ' ', '') || coalesce (ln, ''));
  end if;

  if disp is null or disp = '' then
    disp := nullif (trim (split_part (coalesce (new.email, ''), '@', 1)), '');
  end if;

  if disp is null or disp = '' then
    disp := 'User';
  end if;

  insert into public.contact (
    user_id, email, first_name, last_name,
    rx_gender, default_workout_scale, weight_unit, timezone
  )
  values (
    new.id, new.email, fn, ln,
    rg, coalesce(dws, 'rx'), coalesce(wu, 'lb'), tz
  )
  returning id into new_contact_id;

  insert into public.profiles (id, contact_id, display_name)
  values (new.id, new_contact_id, disp);

  return new;
end;
$$;
