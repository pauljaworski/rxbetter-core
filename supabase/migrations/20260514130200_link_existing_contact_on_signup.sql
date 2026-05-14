-- =============================================================================
-- Auth signup: claim exactly one pre-created contact before creating a new one
-- =============================================================================
-- Gym onboarding and invite flows can create contact rows before the athlete or
-- coach signs up. Keep those memberships/subscriptions attached by linking the
-- new auth user to the existing unclaimed contact when the email match is
-- unambiguous.

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_contact_id uuid;
  matched_contact_id uuid;
  matched_contact_count integer := 0;
  meta jsonb;
  fn text;
  ln text;
  disp text;
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

  if new.email is not null then
    select count(*)
      into matched_contact_count
    from public.contact c
    where c.user_id is null
      and lower (trim (c.email)) = lower (trim (new.email));

    if matched_contact_count = 1 then
      select c.id
        into matched_contact_id
      from public.contact c
      where c.user_id is null
        and lower (trim (c.email)) = lower (trim (new.email))
      limit 1;
    end if;
  end if;

  if matched_contact_count = 1 then
    update public.contact
    set
      user_id = new.id,
      email = coalesce (public.contact.email, new.email),
      first_name = coalesce (nullif (trim (public.contact.first_name), ''), fn),
      last_name = coalesce (nullif (trim (public.contact.last_name), ''), ln),
      updated_at = now ()
    where id = matched_contact_id
      and user_id is null
    returning id into new_contact_id;
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
  'After insert on auth.users: claims one unlinked matching contact when available, otherwise creates public.contact, then creates public.profiles.';
