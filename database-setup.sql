-- Создание правильной структуры таблиц согласно схеме

-- Добавляем статус события, если отсутствует
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft','published','archived'));

DROP TABLE IF EXISTS tickets CASCADE;
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES single_seats(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','held','sold')),
  hold_expires_at TIMESTAMPTZ,
  order_item_id UUID,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tickets_order_item_id_fkey
    FOREIGN KEY (order_item_id)
    REFERENCES order_items(id)
    ON DELETE SET NULL,
  -- Constraint: ticket должен быть либо для zone, либо для seat
  CONSTRAINT ticket_zone_or_seat CHECK (
    (zone_id IS NOT NULL AND seat_id IS NULL) OR 
    (zone_id IS NULL AND seat_id IS NOT NULL)
  )
);

-- 2. Создаем таблицу orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Ссылка на auth.users.id
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
  total_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создаем таблицу order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: one ticket per order item
  UNIQUE(ticket_id)
);

-- 4. Создаем таблицу user_meta
CREATE TABLE IF NOT EXISTS user_meta (
  id UUID PRIMARY KEY, -- Совпадает с auth.users.id
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Включаем RLS для всех таблиц
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meta ENABLE ROW LEVEL SECURITY;

-- 6. Создаем политики RLS
CREATE POLICY "Allow all operations on tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_meta" ON user_meta FOR ALL USING (true);

-- 7. Создаем правильную функцию для создания билетов (БЕЗ category_id)
CREATE OR REPLACE FUNCTION create_event_tickets(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  v_venue_id UUID;
  v_zone_record RECORD;
  v_seat_record RECORD;
  v_tickets_created INTEGER := 0;
  v_seats_created INTEGER := 0;
  v_zones_created INTEGER := 0;
  v_result JSON;
BEGIN
  -- Получаем venue_id для события
  SELECT venue_id INTO v_venue_id FROM events WHERE id = p_event_id;
  
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Event has no venue assigned';
  END IF;

  -- Проверяем наличие проданных билетов
  IF EXISTS (SELECT 1 FROM tickets WHERE event_id = p_event_id AND status = 'sold') THEN
    RAISE EXCEPTION 'Cannot recreate tickets: sold tickets exist';
  END IF;

  -- Удаляем только свободные и удержанные билеты
  DELETE FROM tickets WHERE event_id = p_event_id AND status IN ('free', 'held');

  -- Создаем билеты для зон (sections/polygons)
  FOR v_zone_record IN
    SELECT id, capacity FROM zones WHERE venue_id = v_venue_id AND capacity > 0
  LOOP
    -- Создаем билеты для каждой зоны
    FOR i IN 1..v_zone_record.capacity LOOP
      INSERT INTO tickets (
        event_id, zone_id, seat_id, status, created_at, updated_at
      ) VALUES (
        p_event_id, v_zone_record.id, NULL, 'free', NOW(), NOW()
      );
      v_tickets_created := v_tickets_created + 1;
    END LOOP;
    v_zones_created := v_zones_created + 1;
  END LOOP;

  -- Создаем билеты для отдельных мест
  FOR v_seat_record IN 
    SELECT id FROM single_seats WHERE venue_id = v_venue_id
  LOOP
    INSERT INTO tickets (
      event_id, zone_id, seat_id, status, created_at, updated_at
    ) VALUES (
      p_event_id, NULL, v_seat_record.id, 'free', NOW(), NOW()
    );
    v_tickets_created := v_tickets_created + 1;
    v_seats_created := v_seats_created + 1;
  END LOOP;

  -- Обновляем статус события на published
  UPDATE events SET status = 'published', updated_at = NOW() WHERE id = p_event_id;

  -- Возвращаем результат
  v_result := json_build_object(
    'tickets_created', v_tickets_created,
    'seats_created', v_seats_created,
    'zones_created', v_zones_created,
    'event_id', p_event_id
  );

  RETURN json_build_array(v_result);
END;
$$ LANGUAGE plpgsql;

-- 8. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_zone_id ON tickets(zone_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seat_id ON tickets(seat_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_hold_expires ON tickets(hold_expires_at) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ticket_id ON order_items(ticket_id);
