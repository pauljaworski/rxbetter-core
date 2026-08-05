-- =============================================================================
-- Auth signup: link existing unclaimed contact before creating a new one
-- =============================================================================
-- Onboarding/admin flows may pre-create contact, fitness_membership, and
-- athlete_subscription rows before the user signs in. The auth trigger must
-- attach the new auth.users row to that contact or RLS identity fragments.

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_contact_id uuid;
  candidate_count integer := 0;
  meta             jsonb;
  fn               text;
  ln               text;
  disp             text;
begin
  meta := coalesce (new.raw_user_meta_data, '{}'::jsonb);
  fn := nullif (trim (coalesce (meta->>'first_name', meta->>'given_name')), '');
  ln := nullif (trim (coalesce (meta->>'last_name', meta->>'family_name')), '');
  disp := nullif (trim (coalesce (meta->>'full_name', meta->>'name')), '');

  if disp is null and (fn is not null or ln is not null) then
    disp := trim (coalesce (fn || ' ', '') || coalesce (ln, ''));
  end if;

  if disp is null or disp = '' then
    disp := nullif (trim (split_part (coalesce (new.email, ''), '@', 1)), '');
  end if;

  if disp is null or disp = '' then
    disp := 'User';
  end if;

  -- Prefer a contact that was explicitly linked by a trusted server flow.
  select c.id into new_contact_id
  from public.contact c
  where c.user_id = new.id
  limit 1;

  -- Otherwise claim exactly one unlinked contact matching the signup email.
  -- Multiple matches are ambiguous, so fall through and create a new contact.
  if new_contact_id is null and new.email is not null then
    with candidates as (
      select c.id, c.created_at
      from public.contact c
      where c.user_id is null
        and c.email is not null
        and lower (c.email) = lower (new.email)
      order by c.created_at, c.id
      for update
    ),
    candidate_summary as (
      select
        count(*) as total,
        array_agg (id order by created_at, id) as ids
      from candidates
    )
    select total, case when total = 1 then ids[1] else null end
      into candidate_count, new_contact_id
    from candidate_summary;

    if candidate_count = 1 then
      update public.contact
      set
        user_id = new.id,
        email = coalesce (email, new.email),
        first_name = coalesce (first_name, fn),
        last_name = coalesce (last_name, ln),
        updated_at = now ()
      where id = new_contact_id;
    else
      new_contact_id := null;
    end if;
  end if;

  if new_contact_id is null then
    insert into public.contact (user_id, email, first_name, last_name)
    values (new.id, new.email, fn, ln)
    returning id into new_contact_id;
  end if;

  insert into public.profiles (id, contact_id, display_name)
  values (new.id, new_contact_id, disp);

  return new;
end;
$$;

comment on function public.handle_new_user () is
  'After insert on auth.users: links one unclaimed matching contact when safe, otherwise creates contact, then creates profiles.';
