CREATE DATABASE helpdesk_test OWNER helpdesk;

-- Dev placeholder, the same value as POSTGRES_PASSWORD. Replace both together.
-- helpdesk_owner runs migrations and is not the API login.
-- helpdesk_app is the API login and owns no tables.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_owner') THEN
    CREATE ROLE helpdesk_owner LOGIN SUPERUSER PASSWORD 'change-me';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_app') THEN
    CREATE ROLE helpdesk_app LOGIN NOSUPERUSER NOINHERIT PASSWORD 'change-me';
  END IF;
END
$$;
