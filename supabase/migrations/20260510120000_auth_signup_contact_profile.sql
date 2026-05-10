-- =============================================================================
-- Auth signup: create master contact + profiles row for every new auth user
-- =============================================================================
-- Runs as SECURITY DEFINER so inserts succeed regardless of session JWT / RLS.
-- Order: contact (user_id = auth.users.id) -> profiles (id, contact_id).

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

  insert into public.contact (user_id, email, first_name, last_name)
  values (new.id, new.email, fn, ln)
  returning id into new_contact_id;

  insert into public.profiles (id, contact_id, display_name)
  values (new.id, new_contact_id, disp);

  return new;
end;
$$;

comment on function public.handle_new_user () is
  'After insert on auth.users: creates public.contact (master identity) and public.profiles (auth bridge).';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();
