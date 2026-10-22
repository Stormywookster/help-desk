-- Dev placeholder, the same value as POSTGRES_PASSWORD. Replace both together.
-- The image user (POSTGRES_USER) is the bootstrap superuser. It is not the API login.
-- helpdesk_owner owns the databases and runs migrations. It is not a superuser.
-- helpdesk_app is the API login and owns nothing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_owner') THEN
    CREATE ROLE helpdesk_owner LOGIN NOSUPERUSER NOCREATEROLE NOBYPASSRLS PASSWORD 'change-me';
  ELSE
    ALTER ROLE helpdesk_owner WITH LOGIN NOSUPERUSER NOCREATEROLE NOBYPASSRLS PASSWORD 'change-me';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_app') THEN
    CREATE ROLE helpdesk_app LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT PASSWORD 'change-me';
  ELSE
    ALTER ROLE helpdesk_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT PASSWORD 'change-me';
  END IF;
END
$$;

ALTER DATABASE helpdesk OWNER TO helpdesk_owner;

-- Trusted extensions (PG 13+). Pre-create them so the owner's
-- CREATE EXTENSION IF NOT EXISTS in the migration is a no-op.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE DATABASE helpdesk_test OWNER helpdesk_owner;

\c helpdesk_test

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
