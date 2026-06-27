-- Rotate Triad seed accounts that previously used a committed shared password.
do $$
begin
  update auth.users
  set
    encrypted_password = extensions.crypt(
      gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text,
      extensions.gen_salt('bf')
    ),
    updated_at = now()
  where lower(email) in (
    'brooke.n.webber@gmail.com',
    'bobby@ftprehab.com',
    'codyhouchin@outlook.com'
  );
end;
$$;
