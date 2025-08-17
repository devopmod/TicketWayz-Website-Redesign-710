-- Create RPC to process orders and tickets in a single transaction
CREATE OR REPLACE FUNCTION create_order_with_items(
    user_id uuid,
    items jsonb,
    total_price numeric,
    currency text DEFAULT 'EUR'
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order orders;
    item jsonb;
    new_order_item_id uuid;
BEGIN
    -- Insert the order record with pending status
    INSERT INTO orders (user_id, status, total_price, currency, created_at, updated_at)
    VALUES (user_id, 'pending', total_price, currency, NOW(), NOW())
    RETURNING * INTO new_order;

    -- Process each order item
    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
        INSERT INTO order_items (order_id, ticket_id, unit_price, currency, created_at, updated_at)
        VALUES (
            new_order.id,
            (item->>'ticket_id')::uuid,
            (item->>'unit_price')::numeric,
            COALESCE(item->>'currency', currency),
            NOW(),
            NOW()
        )
        RETURNING id INTO new_order_item_id;

        -- Update ticket status; ensure ticket is free
        UPDATE tickets
        SET status = 'sold',
            order_item_id = new_order_item_id,
            updated_at = NOW()
        WHERE id = (item->>'ticket_id')::uuid
          AND status = 'free';

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket % is not free', (item->>'ticket_id')::uuid;
        END IF;
    END LOOP;

    -- Mark order as paid after successful processing
    UPDATE orders
    SET status = 'paid',
        updated_at = NOW()
    WHERE id = new_order.id
    RETURNING * INTO new_order;

    RETURN new_order;
EXCEPTION
    WHEN OTHERS THEN
        -- Mark order as failed on error
        IF new_order.id IS NOT NULL THEN
            UPDATE orders
            SET status = 'failed',
                updated_at = NOW()
            WHERE id = new_order.id
            RETURNING * INTO new_order;
            RETURN new_order;
        ELSE
            RAISE;
        END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, jsonb, numeric, text) TO anon, authenticated;
