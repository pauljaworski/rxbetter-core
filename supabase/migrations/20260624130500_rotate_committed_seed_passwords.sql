-- Force-reset auth accounts that may have been provisioned by committed seed SQL.
-- The new password value is intentionally random and not recoverable; affected
-- athletes should use the normal password reset/invite flow before signing in.
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
);
