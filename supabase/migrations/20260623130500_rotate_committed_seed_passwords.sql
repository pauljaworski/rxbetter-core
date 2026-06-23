-- Rotate seeded auth accounts that were created with a committed shared password.
-- These POC accounts must be activated via password recovery/invite instead.

update auth.users
set
  encrypted_password = extensions.crypt(
    gen_random_uuid()::text || gen_random_uuid()::text,
    extensions.gen_salt('bf')
  ),
  updated_at = now()
where lower(email) in (
  'bobby@ftprehab.com',
  'brooke.n.webber@gmail.com',
  'codyhouchin@outlook.com'
)
  and encrypted_password = extensions.crypt('TriadTrain2026!', encrypted_password);
