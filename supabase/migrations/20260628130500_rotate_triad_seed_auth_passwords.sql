-- Rotate auth passwords that were seeded from versioned POC migrations.
-- These accounts must use the normal reset/invite flow before signing in.
update auth.users
set
  encrypted_password = extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text, extensions.gen_salt('bf')),
  updated_at = now()
where lower(email) in (
  'brooke.n.webber@gmail.com',
  'bobby@ftprehab.com',
  'codyhouchin@outlook.com'
);
