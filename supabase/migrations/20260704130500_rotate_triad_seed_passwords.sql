-- Rotate any Triad POC auth users that were created with the committed seed password.
-- Future migrations use randomized passwords; athletes should log in via reset/invite.

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
