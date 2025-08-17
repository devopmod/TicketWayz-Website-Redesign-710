-- Regenerate tickets for all existing events after updating create_event_tickets
SELECT create_event_tickets(id) FROM events;
