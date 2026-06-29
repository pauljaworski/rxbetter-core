-- Rotate committed POC seed passwords and allow group completions per workout date.

update auth.users
set
  encrypted_password = extensions.crypt(
    gen_random_uuid()::text || gen_random_uuid()::text,
    extensions.gen_salt('bf')
  ),
  updated_at = now()
where lower(email) in (
    'brooke.n.webber@gmail.com',
    'bobby@ftprehab.com',
    'codyhouchin@outlook.com'
  )
  and encrypted_password = extensions.crypt('TriadTrain2026!', encrypted_password);

drop index if exists public.athlete_segment_completion_group_uidx;

create unique index athlete_segment_completion_group_uidx
  on public.athlete_segment_completion (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;

create index if not exists athlete_performance_segment_group_date_idx
  on public.athlete_performance (segment_group_id, contact_id, performance_date)
  where segment_group_id is not null;
