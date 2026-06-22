-- Rotate Triad seed accounts that still have the committed shared password.
-- Users should sign in via password reset/invite flow instead of a repo-visible secret.

update auth.users u
set
  encrypted_password = extensions.crypt(
    gen_random_uuid()::text || gen_random_uuid()::text,
    extensions.gen_salt('bf')
  ),
  updated_at = now()
where lower(u.email) in (
    'brooke.n.webber@gmail.com',
    'bobby@ftprehab.com',
    'codyhouchin@outlook.com'
  )
  and u.encrypted_password = extensions.crypt('TriadTrain2026!', u.encrypted_password);
