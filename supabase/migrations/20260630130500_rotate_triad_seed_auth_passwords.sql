-- Rotate Triad POC auth users that may have been created by earlier seed migrations
-- with a committed shared password. These athletes should sign in through reset/invite.

update auth.users
set
  encrypted_password = extensions.crypt(
    gen_random_uuid()::text || ':' || clock_timestamp()::text,
    extensions.gen_salt('bf')
  ),
  updated_at = now()
where lower(email) in (
  'brooke.n.webber@gmail.com',
  'bobby@ftprehab.com',
  'codyhouchin@outlook.com'
);
