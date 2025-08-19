-- Ensure cascading delete of an event and related data
CREATE OR REPLACE FUNCTION delete_event_cascade(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remove order items associated with event tickets
    DELETE FROM order_items
    WHERE ticket_id IN (
        SELECT id FROM tickets WHERE event_id = delete_event_cascade.event_id
    );

    -- Remove tickets for the event
    DELETE FROM tickets WHERE event_id = delete_event_cascade.event_id;

    -- Remove event prices
    DELETE FROM event_prices WHERE event_id = delete_event_cascade.event_id;

    -- Finally remove the event itself
    DELETE FROM events WHERE id = delete_event_cascade.event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_event_cascade(uuid) TO anon, authenticated;
