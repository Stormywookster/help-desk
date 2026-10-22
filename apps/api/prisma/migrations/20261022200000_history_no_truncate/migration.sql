-- TRUNCATE skips the row-level append-only triggers (QA note 3, Architect note 2).
-- helpdesk.purge is unchanged: it still allows DELETE, and it does not allow TRUNCATE.

CREATE FUNCTION helpdesk_reject_history_truncate() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'append-only history cannot be truncated'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER ticket_events_append_only_truncate
  BEFORE TRUNCATE ON ticket_events
  FOR EACH STATEMENT EXECUTE FUNCTION helpdesk_reject_history_truncate();

CREATE TRIGGER ticket_messages_append_only_truncate
  BEFORE TRUNCATE ON ticket_messages
  FOR EACH STATEMENT EXECUTE FUNCTION helpdesk_reject_history_truncate();

CREATE TRIGGER audit_log_append_only_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION helpdesk_reject_history_truncate();
