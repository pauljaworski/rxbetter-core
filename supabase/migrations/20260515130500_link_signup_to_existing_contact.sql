-- =============================================================================
-- Auth signup: claim a pre-created contact when exactly one matching email exists
-- =============================================================================
-- Staff/onboarding can create contact + membership rows before an athlete signs up.
-- The auth trigger must attach that existing identity instead of creating a
-- second contact that strands gym memberships and subscriptions.

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_contact_id uuid;
  matching_contact_id uuid;
  matching_contact_count integer := 0;
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

  if new.email is not null and trim (new.email) <> '' then
    select count(*), min(id)
      into matching_contact_count, matching_contact_id
    from public.contact
    where user_id is null
      and email is not null
      and lower(trim(email)) = lower(trim(new.email));
  end if;

  if matching_contact_count = 1 then
    update public.contact
    set
      user_id = new.id,
      first_name = coalesce (first_name, fn),
      last_name = coalesce (last_name, ln),
      email = coalesce (email, new.email),
      updated_at = now ()
    where id = matching_contact_id
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
  'After insert on auth.users: links exactly one unclaimed matching contact by email, otherwise creates public.contact, then creates public.profiles.';
