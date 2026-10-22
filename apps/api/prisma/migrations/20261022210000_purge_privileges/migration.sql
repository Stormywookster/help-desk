-- T49. helpdesk_owner owns the schema. helpdesk_app is the API login and owns nothing.
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
END
$$;

-- audit_log may change only data and ip, and only while helpdesk.purge is on.
CREATE FUNCTION helpdesk_reject_audit_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('helpdesk.purge', true) IS DISTINCT FROM 'on' THEN
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

DROP TRIGGER audit_log_append_only_update ON audit_log;
CREATE TRIGGER audit_log_append_only_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION helpdesk_reject_audit_update();

-- Kept keys are references and counts. Every other value becomes "[redacted]".
CREATE FUNCTION helpdesk_redact_audit_data(payload jsonb) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    jsonb_object_agg(
      entry.key,
      CASE
        WHEN entry.key = ANY (ARRAY[
          'reference', 'references', 'ticket_id', 'ticket_ids',
          'messages', 'events', 'attachments', 'counts', 'tickets',
          'message_count', 'event_count', 'attachment_count'
        ]) THEN entry.value
        WHEN jsonb_typeof(entry.value) = 'number' THEN entry.value
        ELSE to_jsonb('[redacted]'::text)
      END
    ),
    '{}'::jsonb
  ) || jsonb_build_object('redacted_at', to_jsonb(now()))
  FROM jsonb_each(payload) AS entry(key, value);
$$;

CREATE FUNCTION helpdesk_purge_ticket(ticket_id uuid, actor uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  ref text;
  message_count integer;
  event_count integer;
  attachment_count integer;
BEGIN
  PERFORM set_config('helpdesk.purge', 'on', true);

  SELECT t.reference INTO ref
  FROM tickets AS t
  WHERE t.id = helpdesk_purge_ticket.ticket_id;
  IF ref IS NULL THEN
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*)::integer INTO message_count
  FROM ticket_messages AS m
  WHERE m.ticket_id = helpdesk_purge_ticket.ticket_id;
  SELECT count(*)::integer INTO event_count
  FROM ticket_events AS e
  WHERE e.ticket_id = helpdesk_purge_ticket.ticket_id;
  SELECT count(*)::integer INTO attachment_count
  FROM attachments AS a
  WHERE a.ticket_id = helpdesk_purge_ticket.ticket_id;

  DELETE FROM tickets AS t WHERE t.id = helpdesk_purge_ticket.ticket_id;

  INSERT INTO audit_log (actor_user_id, action, data)
  VALUES (
    actor,
    'ticket.hard_deleted',
    jsonb_build_object(
      'references', jsonb_build_array(ref),
      'tickets', 1,
      'messages', message_count,
      'events', event_count,
      'attachments', attachment_count
    )
  );
END;
$$;

CREATE FUNCTION helpdesk_erase_customer(email citext, actor uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  refs jsonb;
  names text[];
  needles text[];
  ticket_count integer;
  message_count integer;
  event_count integer;
  attachment_count integer;
BEGIN
  PERFORM set_config('helpdesk.purge', 'on', true);

  SELECT
    count(*)::integer,
    coalesce(jsonb_agg(t.reference ORDER BY t.reference), '[]'::jsonb),
    coalesce(
      array_agg(DISTINCT t.customer_name) FILTER (
        WHERE t.customer_name IS NOT NULL AND btrim(t.customer_name) <> ''
      ),
      ARRAY[]::text[]
    )
  INTO ticket_count, refs, names
  FROM tickets AS t
  WHERE t.customer_email = helpdesk_erase_customer.email;

  SELECT count(*)::integer INTO message_count
  FROM ticket_messages AS m
  JOIN tickets AS t ON t.id = m.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;
  SELECT count(*)::integer INTO event_count
  FROM ticket_events AS e
  JOIN tickets AS t ON t.id = e.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;
  SELECT count(*)::integer INTO attachment_count
  FROM attachments AS a
  JOIN tickets AS t ON t.id = a.ticket_id
  WHERE t.customer_email = helpdesk_erase_customer.email;

  DELETE FROM tickets AS t
  WHERE t.customer_email = helpdesk_erase_customer.email;

  -- Never delete audit_log. Rewrite customer and free-text values in place.
  needles := names || ARRAY[helpdesk_erase_customer.email::text];
  UPDATE audit_log AS a
  SET
    data = helpdesk_redact_audit_data(a.data),
    ip = CASE WHEN a.actor_user_id IS NULL THEN NULL ELSE a.ip END
  WHERE EXISTS (
    SELECT 1
    FROM unnest(needles) AS needle(value)
    WHERE needle.value <> ''
      AND strpos(lower(a.data::text), lower(needle.value)) > 0
  );

  INSERT INTO audit_log (actor_user_id, action, data)
  VALUES (
    actor,
    'customer.erased',
    jsonb_build_object(
      'references', refs,
      'tickets', ticket_count,
      'messages', message_count,
      'events', event_count,
      'attachments', attachment_count
    )
  );
END;
$$;

ALTER FUNCTION helpdesk_reject_audit_update() OWNER TO helpdesk_owner;
ALTER FUNCTION helpdesk_redact_audit_data(jsonb) OWNER TO helpdesk_owner;
ALTER FUNCTION helpdesk_purge_ticket(uuid, uuid) OWNER TO helpdesk_owner;
ALTER FUNCTION helpdesk_erase_customer(citext, uuid) OWNER TO helpdesk_owner;

REVOKE ALL ON FUNCTION helpdesk_redact_audit_data(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION helpdesk_purge_ticket(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION helpdesk_erase_customer(citext, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION helpdesk_purge_ticket(uuid, uuid) TO helpdesk_app;
GRANT EXECUTE ON FUNCTION helpdesk_erase_customer(citext, uuid) TO helpdesk_app;

GRANT USAGE ON SCHEMA public TO helpdesk_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM helpdesk_app;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
  ON ALL TABLES IN SCHEMA public TO helpdesk_app;
REVOKE DELETE, TRUNCATE ON TABLE
  ticket_events, ticket_messages, audit_log FROM helpdesk_app;
REVOKE UPDATE ON TABLE audit_log FROM helpdesk_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO helpdesk_app;

ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO helpdesk_app;
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

REASSIGN OWNED BY CURRENT_USER TO helpdesk_owner;
