INSERT INTO users (
  email,
  display_name,
  role,
  credential_salt,
  credential_hash,
  credential_iterations
)
VALUES (
  'user@example.com',
  'Local User',
  'user',
  'users_local_seed_salt_v1',
  'password123',
  210000
)
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  credential_salt = EXCLUDED.credential_salt,
  credential_hash = EXCLUDED.credential_hash,
  credential_iterations = EXCLUDED.credential_iterations;
