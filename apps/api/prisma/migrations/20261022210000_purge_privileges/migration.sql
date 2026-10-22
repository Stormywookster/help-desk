-- T49 / T49a. helpdesk_owner owns the schema and is not a superuser.
-- Create both roles before migrating (deploy/postgres/init-test-db.sql).
-- The GUC remains a second guard. Table privileges are the enforcement for the app.
-- The BEFORE TRUNCATE triggers from the previous migration stay in place.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_owner') THEN
    RAISE EXCEPTION 'helpdesk_owner is missing. Create it before migrating. See deploy/env.example.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_app') THEN
    RAISE EXCEPTION 'helpdesk_app is missing. Create it before migrating. See deploy/env.example.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'helpdesk_owner'
      AND (rolsuper OR rolcreaterole OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'helpdesk_owner must be LOGIN NOSUPERUSER NOCREATEROLE NOBYPASSRLS. See deploy/env.example.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'helpdesk_app'
      AND (rolsuper OR rolbypassrls OR rolinherit)
  ) THEN
    RAISE EXCEPTION 'helpdesk_app must be LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT. See deploy/env.example.';
  END IF;
END
$$;

-- audit_log may change only data and ip, and only while helpdesk.purge is on.
CREATE FUNCTION public.helpdesk_reject_audit_update() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF pg_catalog.current_setting('helpdesk.purge', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'append-only history cannot be updated'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
     OR NEW.action IS DISTINCT FROM OLD.action
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'audit_log update may change only data and ip'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER audit_log_append_only_update ON public.audit_log;
CREATE TRIGGER audit_log_append_only_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.helpdesk_reject_audit_update();

-- Kept keys are references and counts. Every other value becomes "[redacted]".
CREATE FUNCTION public.helpdesk_redact_audit_data(payload jsonb) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
           WHEN aggregated IS NULL THEN '{}'::pg_catalog.jsonb
           ELSE aggregated
         END || pg_catalog.jsonb_build_object(
           'redacted_at',
           pg_catalog.to_jsonb(pg_catalog.now())
         )
  FROM (
    SELECT pg_catalog.jsonb_object_agg(
      entry.key,
      CASE
        WHEN entry.key = ANY (ARRAY[
          'reference', 'references', 'ticket_id', 'ticket_ids',
          'messages', 'events', 'attachments', 'counts', 'tickets',
          'message_count', 'event_count', 'attachment_count'
        ]) THEN entry.value
        WHEN pg_catalog.jsonb_typeof(entry.value) = 'number' THEN entry.value
        ELSE pg_catalog.to_jsonb('[redacted]'::text)
      END
    ) AS aggregated
    FROM pg_catalog.jsonb_each(payload) AS entry(key, value)
  ) AS redacted;
$$;

-- pg_temp is last so a same-named temp table is not chosen over public.
CREATE FUNCTION public.helpdesk_purge_ticket(ticket_id uuid, actor uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  ref text;
  message_count integer;
  event_count integer;
  attachment_count integer;
BEGIN
  PERFORM pg_catalog.set_config('helpdesk.purge', 'on', true);

  SELECT t.reference INTO ref
  FROM public.tickets AS t
  WHERE t.id = helpdesk_purge_ticket.ticket_id;
  IF ref IS NULL THEN
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT pg_catalog.count(*)::integer INTO message_count
  FROM public.ticket_messages AS m
  WHERE m.ticket_id = helpdesk_purge_ticket.ticket_id;
  SELECT pg_catalog.count(*)::integer INTO event_count
  FROM public.ticket_events AS e
  WHERE e.ticket_id = helpdesk_purge_ticket.ticket_id;
  SELECT pg_catalog.count(*)::integer INTO attachment_count
  FROM public.attachments AS a
  WHERE a.ticket_id = helpdesk_purge_ticket.ticket_id;

  DELETE FROM public.tickets AS t WHERE t.id = helpdesk_purge_ticket.ticket_id;

  INSERT INTO public.audit_log (actor_user_id, action, data)
  VALUES (
    actor,
    'ticket.hard_deleted',
    pg_catalog.jsonb_build_object(
      'references', pg_catalog.jsonb_build_array(ref),
      'tickets', 1,
      'messages', message_count,
      'events', event_count,
      'attachments', attachment_count
    )
  );
END;
$$;

-- Select audit rows by exact identifiers only: citext email keys, and ticket
-- ids collected before the tickets are deleted. Never by substring.
CREATE FUNCTION public.helpdesk_erase_customer(email public.citext, actor uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  refs jsonb;
  ticket_ids uuid[];
  ticket_count integer;
  message_count integer;
  event_count integer;
  attachment_count integer;
  uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
BEGIN
  PERFORM pg_catalog.set_config('helpdesk.purge', 'on', true);

  SELECT
    counted.ticket_count,
    CASE
      WHEN counted.refs IS NULL THEN '[]'::pg_catalog.jsonb
      ELSE counted.refs
    END,
    CASE
      WHEN counted.ids IS NULL THEN ARRAY[]::pg_catalog.uuid[]
      ELSE counted.ids
    END
  INTO ticket_count, refs, ticket_ids
  FROM (
    SELECT
      pg_catalog.count(*)::integer AS ticket_count,
      pg_catalog.jsonb_agg(t.reference ORDER BY t.reference) AS refs,
      pg_catalog.array_agg(t.id) AS ids
    FROM public.tickets AS t
    WHERE t.customer_email = helpdesk_erase_customer.email
  ) AS counted;

  SELECT pg_catalog.count(*)::integer INTO message_count
  FROM public.ticket_messages AS m
  JOIN public.tickets AS t ON t.id = m.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;
  SELECT pg_catalog.count(*)::integer INTO event_count
  FROM public.ticket_events AS e
  JOIN public.tickets AS t ON t.id = e.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;
  SELECT pg_catalog.count(*)::integer INTO attachment_count
  FROM public.attachments AS a
  JOIN public.tickets AS t ON t.id = a.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;

  DELETE FROM public.tickets AS t
  WHERE t.customer_email = helpdesk_erase_customer.email;

  -- Never delete audit_log. Rewrite matched rows in place.
  UPDATE public.audit_log AS a
  SET
    data = public.helpdesk_redact_audit_data(a.data),
    ip = CASE WHEN a.actor_user_id IS NULL THEN NULL ELSE a.ip END
  WHERE (a.data ->> 'customer_email')::public.citext = helpdesk_erase_customer.email
     OR (a.data ->> 'email')::public.citext = helpdesk_erase_customer.email
     OR (a.data ->> 'customer_id')::public.citext = helpdesk_erase_customer.email
     OR CASE
          WHEN (a.data ->> 'ticket_id') ~ uuid_pattern
            THEN (a.data ->> 'ticket_id')::pg_catalog.uuid = ANY (ticket_ids)
          ELSE false
        END
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.jsonb_array_elements_text(
         CASE
           WHEN pg_catalog.jsonb_typeof(a.data -> 'ticket_ids') = 'array'
             THEN a.data -> 'ticket_ids'
           ELSE '[]'::pg_catalog.jsonb
         END
       ) AS element(value)
       WHERE CASE
         WHEN element.value ~ uuid_pattern
           THEN element.value::pg_catalog.uuid = ANY (ticket_ids)
         ELSE false
       END
     );

  INSERT INTO public.audit_log (actor_user_id, action, data)
  VALUES (
    actor,
    'customer.erased',
    pg_catalog.jsonb_build_object(
      'references', refs,
      'tickets', ticket_count,
      'messages', message_count,
      'events', event_count,
      'attachments', attachment_count
    )
  );
END;
$$;

ALTER FUNCTION public.helpdesk_reject_audit_update() OWNER TO helpdesk_owner;
ALTER FUNCTION public.helpdesk_redact_audit_data(jsonb) OWNER TO helpdesk_owner;
ALTER FUNCTION public.helpdesk_purge_ticket(uuid, uuid) OWNER TO helpdesk_owner;
ALTER FUNCTION public.helpdesk_erase_customer(public.citext, uuid) OWNER TO helpdesk_owner;

REVOKE ALL ON FUNCTION public.helpdesk_redact_audit_data(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.helpdesk_purge_ticket(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.helpdesk_erase_customer(public.citext, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.helpdesk_purge_ticket(uuid, uuid) TO helpdesk_app;
GRANT EXECUTE ON FUNCTION public.helpdesk_erase_customer(public.citext, uuid) TO helpdesk_app;

GRANT USAGE ON SCHEMA public TO helpdesk_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM helpdesk_app;

-- DELETE stays only where the app deletes rows itself. Users and products are
-- never deleted. Tickets and history are deleted only inside the definer functions.
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO helpdesk_app;
REVOKE DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM helpdesk_app;
GRANT DELETE ON TABLE
  sessions,
  login_attempts,
  customer_access_sessions,
  secure_links,
  idempotency_keys,
  captcha_spent,
  email_outbox,
  user_mfa_factors,
  settings,
  attachments,
  backup_runs
TO helpdesk_app;
REVOKE UPDATE ON TABLE public.audit_log FROM helpdesk_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO helpdesk_app;

ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO helpdesk_app;
ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_owner IN SCHEMA public
  REVOKE DELETE, TRUNCATE ON TABLES FROM helpdesk_app;
ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO helpdesk_app;

DO $$
BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO helpdesk_app',
    current_database()
  );
END
$$;
