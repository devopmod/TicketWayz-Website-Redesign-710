-- Add status column to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft','published','archived'));

-- Add archived_at columns for soft delete support
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Allow nullable references for soft-deleted relations
ALTER TABLE tickets ALTER COLUMN event_id DROP NOT NULL;
ALTER TABLE order_items ALTER COLUMN ticket_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Update foreign keys
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_event_id_fkey;
ALTER TABLE tickets ADD CONSTRAINT tickets_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_ticket_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_ticket_id_fkey
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_order_item_id_fkey;
ALTER TABLE tickets ADD CONSTRAINT tickets_order_item_id_fkey
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
