-- =============================================================================
-- Auth signup: link a single pre-created contact before creating a new contact
-- =============================================================================
-- Coaches/admins can create contacts, memberships, and subscriptions before a
-- person signs up. Preserve that access by claiming the existing contact when
-- exactly one unclaimed row matches the auth email.

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
    with candidate as (
      select c.id
      from public.contact c
      where c.user_id is null
        and c.email is not null
        and lower (c.email) = lower (new.email)
      for update
    ),
    single_candidate as (
      select min (id) as id
      from candidate
      having count (*) = 1
    )
    update public.contact c
    set user_id = new.id,
        email = coalesce (c.email, new.email),
        first_name = coalesce (nullif (trim (c.first_name), ''), fn),
        last_name = coalesce (nullif (trim (c.last_name), ''), ln)
    from single_candidate sc
    where c.id = sc.id
      and c.user_id is null
    returning c.id into new_contact_id;
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
  'After insert on auth.users: links one unclaimed matching contact when present, otherwise creates contact, then creates public.profiles.';
