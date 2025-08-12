import supabase from '../lib/supabase';

// Create event tickets using stored procedure
export const createEventTickets = async (eventId) => {
  try {
    console.log('Creating tickets for event:', eventId);

    // Call the stored procedure directly
    const { data, error } = await supabase.rpc('create_event_tickets', {
      p_event_id: eventId
    });

    if (error) {
      console.error('Error calling create_event_tickets function:', error);
      throw error;
    }

    console.log('Tickets created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating event tickets:', error);
    throw error;
  }
};

// Get tickets for an event with corrected relationships and additional debugging
export const getEventTickets = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        zone:zones(
          id,
          name,
          capacity,
          category:seat_categories(id, name, color)
        ),
        seat:single_seats(
          id,
          row_number,
          seat_number,
          section,
          x,
          y,
          category:seat_categories(id, name, color)
        ),
        order_item:order_items!tickets_order_item_id_fkey(
          id,
          unit_price,
          currency,
          order:orders(id, status, total_price)
        )
      `)
      .eq('event_id', eventId)
      .order('created_at');

    if (error) throw error;

    // ДОБАВЛЯЕМ ОТЛАДОЧНУЮ ИНФОРМАЦИЮ
    console.log('🎫 ОТЛАДКА: Загружены билеты для события', eventId);
    console.log('🎫 Общее количество билетов:', data?.length || 0);
    
    if (data && data.length > 0) {
      const seatTickets = data.filter(t => t.seat_id);
      const zoneTickets = data.filter(t => t.zone_id);
      
      console.log('🎫 Билеты для отдельных мест:', seatTickets.length);
      console.log('🎫 Билеты для зон:', zoneTickets.length);
      
      // Показываем примеры билетов для отладки
      if (seatTickets.length > 0) {
        console.log('🎫 Пример билета для места:', seatTickets[0]);
      }
      if (zoneTickets.length > 0) {
        console.log('🎫 Пример билета для зоны:', zoneTickets[0]);
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    throw error;
  }
};

// Get available tickets for booking
export const getAvailableTickets = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        zone:zones(
          id,
          name,
          capacity,
          category:seat_categories(id, name, color)
        ),
        seat:single_seats(
          id,
          row_number,
          seat_number,
          section,
          x,
          y,
          category:seat_categories(id, name, color)
        )
      `)
      .eq('event_id', eventId)
      .in('status', ['free', 'available']) // Используем правильные статусы
      .order('created_at');

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching available tickets:', error);
    throw error;
  }
};

// Get tickets count by status for an event
export const getTicketsStatistics = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('status')
      .eq('event_id', eventId);

    if (error) throw error;

    const stats = {
      total: data.length,
      available: data.filter(t => t.status === 'free' || t.status === 'available').length,
      held: data.filter(t => t.status === 'held').length,
      sold: data.filter(t => t.status === 'sold').length
    };

    return stats;
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    throw error;
  }
};

// Hold tickets (бронирование)
export const holdTickets = async (ticketIds, holdDuration = 15) => {
  try {
    const holdExpiresAt = new Date(Date.now() + holdDuration * 60 * 1000);

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'held',
        hold_expires_at: holdExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ticketIds)
      .in('status', ['free', 'available'])
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error holding tickets:', error);
    throw error;
  }
};

// Create order and purchase tickets
export const purchaseTickets = async (ticketIds, orderData) => {
  try {
    // Start transaction
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create user profile if not exists
    const { data: userProfile, error: userError } = await supabase
      .from('user_meta')
      .upsert({
        id: user.id,
        email: orderData.email,
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        phone_number: orderData.phone || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_price: orderData.totalPrice,
        currency: orderData.currency || 'EUR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items and update tickets
    const orderItems = [];
    for (const ticketId of ticketIds) {
      // Get ticket info for price calculation
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          zone:zones(category:seat_categories(id)),
          seat:single_seats(category:seat_categories(id))
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Determine category for price lookup
      const categoryId = ticket.zone?.category?.id || ticket.seat?.category?.id;

      // Get price from event_prices
      const { data: priceData, error: priceError } = await supabase
        .from('event_prices')
        .select('price, currency')
        .eq('event_id', ticket.event_id)
        .eq('category_id', categoryId)
        .single();

      if (priceError) throw priceError;

      // Create order item
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          ticket_id: ticketId,
          unit_price: priceData.price,
          currency: priceData.currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderItemError) throw orderItemError;

      orderItems.push(orderItem);

      // Update ticket status
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          status: 'sold',
          order_item_id: orderItem.id,
          hold_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketUpdateError) throw ticketUpdateError;
    }

    // Update order status to paid (simulate payment)
    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateOrderError) throw updateOrderError;

    return {
      order: updatedOrder,
      orderItems,
      tickets: ticketIds
    };
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    throw error;
  }
};

// Release expired holds
export const releaseExpiredHolds = async () => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'free',
        hold_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'held')
      .lt('hold_expires_at', new Date().toISOString())
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error releasing expired holds:', error);
    throw error;
  }
};

// Get ticket price by category
export const getTicketPrice = async (eventId, categoryId) => {
  try {
    const { data, error } = await supabase
      .from('event_prices')
      .select('price, currency')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching ticket price:', error);
    throw error;
  }
};

// Get ticket category (computed from zone or seat)
export const getTicketCategory = async (ticketId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        zone:zones(category:seat_categories(id, name, color)),
        seat:single_seats(category:seat_categories(id, name, color))
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    // Return category from zone or seat
    return data.zone?.category || data.seat?.category || null;
  } catch (error) {
    console.error('Error fetching ticket category:', error);
    throw error;
  }
};

// Update zone capacity and adjust tickets accordingly
export const updateZoneCapacity = async (zoneId, newCapacity, eventId = null) => {
  try {
    // Get current zone info
    const { data: zone, error: zoneError } = await supabase
      .from('zones')
      .select('capacity, venue_id')
      .eq('id', zoneId)
      .single();

    if (zoneError) throw zoneError;

    const currentCapacity = zone.capacity || 0;
    const capacityDiff = newCapacity - currentCapacity;

    // Update zone capacity
    const { error: updateError } = await supabase
      .from('zones')
      .update({
        capacity: newCapacity,
        updated_at: new Date().toISOString()
      })
      .eq('id', zoneId);

    if (updateError) throw updateError;

    // If we have an active event, adjust tickets
    if (eventId && capacityDiff !== 0) {
      if (capacityDiff > 0) {
        // Add tickets
        const newTickets = Array.from({ length: capacityDiff }, () => ({
          id: crypto.randomUUID(),
          event_id: eventId,
          zone_id: zoneId,
          seat_id: null,
          status: 'free',
          hold_expires_at: null,
          order_item_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('tickets')
          .insert(newTickets);

        if (insertError) throw insertError;
      } else {
        // Remove tickets (only free ones)
        const { data: freeTickets, error: freeError } = await supabase
          .from('tickets')
          .select('id')
          .eq('event_id', eventId)
          .eq('zone_id', zoneId)
          .eq('status', 'free')
          .limit(Math.abs(capacityDiff));

        if (freeError) throw freeError;

        if (freeTickets.length < Math.abs(capacityDiff)) {
          throw new Error('Cannot reduce capacity: not enough free tickets');
        }

        const { error: deleteError } = await supabase
          .from('tickets')
          .delete()
          .in('id', freeTickets.map(t => t.id));

        if (deleteError) throw deleteError;
      }
    }

    return { success: true, capacityDiff };
  } catch (error) {
    console.error('Error updating zone capacity:', error);
    throw error;
  }
};

// Process a refund for an order
export const refundOrder = async (orderId) => {
  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, ticket_id')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // Update ticket status for all tickets in order
    const ticketIds = orderItems.map(item => item.ticket_id);
    const { error: ticketsError } = await supabase
      .from('tickets')
      .update({
        status: 'free',
        order_item_id: null,
        updated_at: new Date().toISOString()
      })
      .in('id', ticketIds);

    if (ticketsError) throw ticketsError;

    return { success: true, orderId, ticketCount: ticketIds.length };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

// Get order details with all related information
export const getOrderDetails = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          ticket:tickets!fk_order_items_ticket_id(
            *,
            event:events(id, title, event_date, location),
            zone:zones(id, name, category:seat_categories(*)),
            seat:single_seats(id, row_number, seat_number, section, category:seat_categories(*))
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Get all orders with basic information
export const getAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          id,
          unit_price,
          ticket:tickets!fk_order_items_ticket_id(
            id,
            status,
            event:events(title, event_date)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};