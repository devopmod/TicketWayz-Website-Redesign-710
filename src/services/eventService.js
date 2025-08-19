import supabase from '../lib/supabase';
import {createEventTickets} from './ticketService';

const isDevelopment = (import.meta.env?.MODE || process.env.NODE_ENV) !== 'production';

const EVENTS_TABLE = 'events';
const EVENT_PRICES_TABLE = 'event_prices';
const TICKETS_TABLE = 'tickets';
const ORDER_ITEMS_TABLE = 'order_items';

// Fetch all events
export const fetchEvents = async (includeArchived = false) => {
  try {
    let query = supabase
      .from('events')
      .select('*, venue:venues(*)');

    if (!includeArchived) {
      query = query.neq('status', 'archived');
    }

    const { data, error } = await query.order('event_date', { ascending: true });

    if (error) throw error;

    // Fetch prices for all events
    const eventsWithPrices = await Promise.all(data.map(async (event) => {
      const { data: priceData, error: priceError } = await supabase
        .from('event_prices')
        .select('*')
        .eq('event_id', event.id)
        .order('price', { ascending: true });

      if (priceError) throw priceError;

      // Add minimum price to event object
      const minPrice = priceData && priceData.length > 0
        ? Math.min(...priceData.map(p => p.price))
        : 0;

      return {
        ...event,
        price: minPrice,
        prices: priceData || []
      };
    }));

    // Resolve image URLs for events stored in Supabase storage
    const eventsWithImages = eventsWithPrices.map(event => {
      let imageUrl = event.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        const { data: publicData } = supabase
          .storage
          .from('event-images')
          .getPublicUrl(imageUrl);
        imageUrl = publicData?.publicUrl || imageUrl;
      }
      return {
        ...event,
        image: imageUrl
      };
    });

    return eventsWithImages;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Fetch event by ID
export const fetchEventById = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, venue:venues(*)')
      .eq('id', eventId)
      .neq('status', 'archived')
      .single();

    if (error) throw error;

    // Fetch event prices
    const { data: priceData, error: priceError } = await supabase
      .from('event_prices')
      .select('*, category:seat_categories(*)')
      .eq('event_id', eventId);

    if (priceError) throw priceError;

    // Calculate minimum price
    const minPrice = priceData && priceData.length > 0
      ? Math.min(...priceData.map(p => p.price))
      : 0;

    let imageUrl = data.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      const { data: publicData } = supabase
        .storage
        .from('event-images')
        .getPublicUrl(imageUrl);
      imageUrl = publicData?.publicUrl || imageUrl;
    }

    return {
      ...data,
      image: imageUrl,
      price: minPrice,
      prices: priceData || []
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// НОВЫЕ ФУНКЦИИ ДЛЯ КАТЕГОРИЙ СОБЫТИЙ

// Fetch all event categories
export const fetchEventCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('category')
      .not('category', 'is', null)
      .order('category');

    if (error) throw error;

    // Получаем уникальные категории
    const uniqueCategories = [...new Set(data.map(event => event.category))];
    
    // Возвращаем в формате объектов с переводами
    return uniqueCategories.map(category => ({
      value: category,
      label: getCategoryLabel(category),
      originalLabel: category
    }));
  } catch (error) {
    console.error('Error fetching event categories:', error);
    return getDefaultCategories(); // Fallback к стандартным категориям
  }
};

// Create or ensure event category exists
export const ensureEventCategory = async (category) => {
  try {
    // Проверяем существует ли уже событие с такой категорией
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('category', category)
      .limit(1);

    if (checkError) throw checkError;

    // Если категория уже используется, ничего не делаем
    if (existingEvents && existingEvents.length > 0) {
      return { exists: true, category };
    }

    // Категория новая, она будет сохранена при создании события
    return { exists: false, category };
  } catch (error) {
    console.error('Error ensuring event category:', error);
    throw error;
  }
};

// Get category label (перевод)
const getCategoryLabel = (category) => {
  const categoryLabels = {
    'concert': 'Концерт',
    'party': 'Вечеринка', 
    'bustour': 'Автобусный тур',
    'theater': 'Театр',
    'sport': 'Спорт',
    'other': 'Другое'
  };
  
  return categoryLabels[category] || category;
};

// Get default categories
const getDefaultCategories = () => {
  return [
    { value: 'concert', label: 'Концерт', originalLabel: 'concert' },
    { value: 'party', label: 'Вечеринка', originalLabel: 'party' },
    { value: 'bustour', label: 'Автобусный тур', originalLabel: 'bustour' },
    { value: 'theater', label: 'Театр', originalLabel: 'theater' },
    { value: 'sport', label: 'Спорт', originalLabel: 'sport' },
    { value: 'other', label: 'Другое', originalLabel: 'other' }
  ];
};

// Create new event with tickets
export const createEvent = async (eventData) => {
  try {
    // Убеждаемся что категория корректна
    await ensureEventCategory(eventData.category);

    // Start a transaction
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        artist: eventData.artist || null,
        genre: eventData.genre || null,
        location: eventData.location,
        event_date: eventData.event_date,
        image: eventData.image,
        venue_id: eventData.venue_id,
        note: eventData.note || null,
        status: 'draft', // Start as draft
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Insert pricing data if available
    if (event && Object.keys(eventData.prices || {}).length > 0) {
      const priceInserts = Object.entries(eventData.prices).map(([categoryId, price]) => ({
        event_id: event.id,
        category_id: categoryId,
        price: parseFloat(price),
        currency: 'EUR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: priceError } = await supabase
        .from('event_prices')
        .insert(priceInserts);

      if (priceError) throw priceError;
    }

    // Create tickets if venue is selected
    if (event.venue_id) {
      try {
        if (isDevelopment) {
          console.log('Creating tickets for event:', event.id);
        }
        const ticketsResult = await createEventTickets(event.id);
        if (isDevelopment) {
          console.log('Tickets creation result:', ticketsResult);
        }

        // Update event status to published after tickets are created
        const { error: statusError } = await supabase
          .from('events')
          .update({
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id);

        if (statusError) throw statusError;

        return {
          ...event,
          status: 'published',
          ticketsCreated: ticketsResult
        };
      } catch (ticketError) {
        console.error('Error creating tickets, but event was created:', ticketError);
        // Event is created but tickets failed - keep as draft
        return {
          ...event,
          ticketError: ticketError.message
        };
      }
    }

    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Update existing event with tickets
export const updateEvent = async (eventId, eventData) => {
  try {
    // Убеждаемся что категория корректна
    await ensureEventCategory(eventData.category);

    // Получаем текущие данные события для сравнения
    const { data: currentEvent, error: currentError } = await supabase
      .from('events')
      .select('venue_id, status')
      .eq('id', eventId)
      .single();

    if (currentError) throw currentError;

    // Обновляем событие
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update({
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        artist: eventData.artist || null,
        genre: eventData.genre || null,
        location: eventData.location,
        event_date: eventData.event_date,
        image: eventData.image,
        venue_id: eventData.venue_id,
        note: eventData.note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (eventError) throw eventError;

    // Delete existing prices
    const { error: deleteError } = await supabase
      .from('event_prices')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) throw deleteError;

    // Insert new prices if available
    if (Object.keys(eventData.prices || {}).length > 0) {
      const priceInserts = Object.entries(eventData.prices).map(([categoryId, price]) => ({
        event_id: eventId,
        category_id: categoryId,
        price: parseFloat(price),
        currency: 'EUR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: priceError } = await supabase
        .from('event_prices')
        .insert(priceInserts);

      if (priceError) throw priceError;
    }

    const venueChanged = currentEvent.venue_id !== eventData.venue_id;
    const shouldRecreate = event.venue_id && (venueChanged || eventData.recreateTickets);

    if (shouldRecreate) {
      try {
        if (isDevelopment) {
          console.log('Recreating tickets for updated event:', eventId);
        }
        const ticketsResult = await createEventTickets(eventId);
        if (isDevelopment) {
          console.log('Tickets recreation result:', ticketsResult);
        }

        // Update event status to published after tickets are recreated
        const { error: statusError } = await supabase
          .from('events')
          .update({
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);

        if (statusError) throw statusError;

        return {
          ...event,
          status: 'published',
          ticketsCreated: ticketsResult
        };
      } catch (ticketError) {
        console.error('Error recreating tickets, but event was updated:', ticketError);
        return {
          ...event,
          ticketError: ticketError.message
        };
      }
    }

    // If tickets are not recreated, сохраняем текущий статус
    return {
      ...event,
      status: currentEvent.status
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}; 

// Archive event without deleting related data
export const archiveEvent = async (eventId) => {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', eventId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error archiving event:', error);
    throw error;
  }
};

// Unarchive event
export const unarchiveEvent = async (eventId) => {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', eventId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error unarchiving event:', error);
    throw error;
  }
};

// Check if event has linked order items (sold tickets)
const hasEventOrderItems = async (eventId) => {
  try {
    const { count, error } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('order_item_id', 'is', null);

    if (error) throw error;

    return count > 0;
  } catch (error) {
    console.error('Error checking event order items:', error);
    throw error;
  }
};

// Delete event but keep sold tickets
export const deleteEventPartial = async (eventId) => {
  try {
    // Remove all tickets that are not sold
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('event_id', eventId)
      .neq('status', 'sold');

    if (ticketsError) throw ticketsError;

    // Get event price IDs linked to sold tickets
    const { data: soldPriceRefs, error: soldPriceError } = await supabase
      .from('tickets')
      .select('event_price_id')
      .eq('event_id', eventId)
      .eq('status', 'sold');

    if (soldPriceError) throw soldPriceError;

    const priceIdsToKeep = (soldPriceRefs || [])
      .map(ticket => ticket.event_price_id)
      .filter(Boolean);

    // Remove event prices that are not referenced by sold tickets
    let priceDeleteQuery = supabase
      .from('event_prices')
      .delete()
      .eq('event_id', eventId);

    if (priceIdsToKeep.length > 0) {
      priceDeleteQuery = priceDeleteQuery.not(
        'id',
        'in',
        `(${priceIdsToKeep.join(',')})`
      );
    }

    const { error: priceError } = await priceDeleteQuery;

    if (priceError) throw priceError;

    // Mark event with status 'partial' so sold tickets remain linked
    const { error: eventError } = await supabase
      .from('events')
      .update({ status: 'partial' })
      .eq('id', eventId);

    if (eventError) throw eventError;

    return true;
  } catch (error) {
    if (error.code === '23503') {
      throw new Error('Невозможно удалить проданные билеты');
    }
    console.error('Error partially deleting event:', error);
    throw error;
  }
};

// Delete event and all related data using RPC/transaction
export const deleteEventCascade = async (eventId) => {
  try {
    // Check if event has sold tickets
    if (await hasEventOrderItems(eventId)) {
      throw new Error('Невозможно удалить проданные билеты');
    }

    const { data, error } = await supabase.rpc('delete_event_cascade', {
      event_id: eventId
    });

    if (error) throw error;

    return data;
  } catch (error) {
    if (error.code === '23503') {
      throw new Error('Невозможно удалить проданные билеты');
    }
    console.error('Error deleting event cascade:', error);
    throw error;
  }
};

// Get statistics for an event
export const getEventStatistics = async (eventId) => {
  try {
    const { data: tickets, error } = await supabase
      .from(TICKETS_TABLE)
      .select(`
        status,
        order_item:${ORDER_ITEMS_TABLE}!tickets_order_item_id_fkey(
          unit_price,
          order:orders(created_at)
        )
      `)
      .eq('event_id', eventId);

    if (error) throw error;

    const totalSeats = tickets?.length || 0;
    let soldSeats = 0;
    let heldSeats = 0;
    let freeSeats = 0;
    let estimatedRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let todaysSales = 0;
    let yesterdaysSales = 0;

    for (const ticket of tickets) {
      switch (ticket.status) {
        case 'sold':
          soldSeats++;
          const price = ticket.order_item?.unit_price || 0;
          estimatedRevenue += price;
          const createdAt = ticket.order_item?.order?.created_at;
          if (createdAt) {
            if (createdAt >= today.toISOString() && createdAt < tomorrow.toISOString()) {
              todaysSales += price;
            } else if (createdAt >= yesterday.toISOString() && createdAt < today.toISOString()) {
              yesterdaysSales += price;
            }
          }
          break;
        case 'held':
          heldSeats++;
          break;
        case 'free':
          freeSeats++;
          break;
        default:
          break;
      }
    }

    const occupancyRate = totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0;
    const averagePrice = soldSeats > 0 ? estimatedRevenue / soldSeats : 0;
    const salesGrowth = yesterdaysSales > 0
      ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100
      : todaysSales > 0 ? 100 : 0;

    return {
      totalSeats,
      soldSeats,
      heldSeats,
      freeSeats,
      occupancyRate,
      estimatedRevenue,
      averagePrice,
      todaysSales,
      salesGrowth
    };
  } catch (error) {
    console.error('Error getting event statistics:', error);
    throw error;
  }
};

// Update event prices with upsert
export const updateEventPrices = async (eventId, prices) => {
  try {
    const records = prices.map(p => ({
      event_id: eventId,
      price: p.price,
      currency: p.currency || 'EUR',
      updated_at: new Date().toISOString(),
      ...(p.id ? { id: p.id } : {}),
      ...(p.category_id ? { category_id: p.category_id } : {})
    }));

    const { data, error } = await supabase
      .from(EVENT_PRICES_TABLE)
      .upsert(records)
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating event prices:', error);
    throw error;
  }
};

// Initialize realtime subscription for event prices and tickets
export const initializeRealtimeSubscription = (eventId, onPricesUpdate, onTicketChange) => {
  const pricesChannel = supabase
    .channel(`event-prices-${eventId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: EVENT_PRICES_TABLE, filter: `event_id=eq.${eventId}` }, payload => onPricesUpdate?.(payload))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: EVENT_PRICES_TABLE, filter: `event_id=eq.${eventId}` }, payload => onPricesUpdate?.(payload))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: EVENT_PRICES_TABLE, filter: `event_id=eq.${eventId}` }, payload => onPricesUpdate?.(payload))
    .subscribe();

  const ticketsChannel = supabase
    .channel(`event-tickets-${eventId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TICKETS_TABLE, filter: `event_id=eq.${eventId}` }, payload => onTicketChange?.(payload))
    .subscribe();

  return () => {
    supabase.removeChannel(pricesChannel);
    supabase.removeChannel(ticketsChannel);
  };
};

// Regenerate event seats using RPC and return updated statistics
export const regenerateEventSeats = async (eventId) => {
  try {
    const { error } = await supabase.rpc('create_event_tickets', { p_event_id: eventId });
    if (error) throw error;
    return await getEventStatistics(eventId);
  } catch (error) {
    console.error('Error regenerating event seats:', error);
    throw error;
  }
};
