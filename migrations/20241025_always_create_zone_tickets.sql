-- Always create zone tickets regardless of single seats
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
