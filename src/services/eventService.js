import supabase from '../lib/supabase';
import {createEventTickets} from './ticketService';

// Fetch all events
export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*,venue:venues(*)')
      .order('event_date', { ascending: true });
    
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
    
    return eventsWithPrices;
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
      .select('*,venue:venues(*)')
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    
    // Fetch event prices
    const { data: priceData, error: priceError } = await supabase
      .from('event_prices')
      .select('*,category:seat_categories(*)')
      .eq('event_id', eventId);
    
    if (priceError) throw priceError;
    
    // Calculate minimum price
    const minPrice = priceData && priceData.length > 0 
      ? Math.min(...priceData.map(p => p.price))
      : 0;
    
    return {
      ...data,
      price: minPrice,
      prices: priceData || []
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// Create new event with tickets
export const createEvent = async (eventData) => {
  try {
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
        console.log('Creating tickets for event:', event.id);
        const ticketsResult = await createEventTickets(event.id);
        console.log('Tickets creation result:', ticketsResult);
        
        // Update event status to published after tickets are created
        const { error: statusError } = await supabase
          .from('events')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', event.id);
        
        if (statusError) throw statusError;
        
        return { ...event, status: 'published', ticketsCreated: ticketsResult };
      } catch (ticketError) {
        console.error('Error creating tickets, but event was created:', ticketError);
        // Event is created but tickets failed - keep as draft
        return { ...event, ticketError: ticketError.message };
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
    // Update event
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
    
    // Recreate tickets if venue is selected
    if (event.venue_id) {
      try {
        console.log('Recreating tickets for updated event:', eventId);
        const ticketsResult = await createEventTickets(eventId);
        console.log('Tickets recreation result:', ticketsResult);
        
        // Update event status to published after tickets are recreated
        const { error: statusError } = await supabase
          .from('events')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', eventId);
        
        if (statusError) throw statusError;
        
        return { ...event, status: 'published', ticketsCreated: ticketsResult };
      } catch (ticketError) {
        console.error('Error recreating tickets, but event was updated:', ticketError);
        return { ...event, ticketError: ticketError.message };
      }
    }
    
    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete event
export const deleteEvent = async (eventId) => {
  try {
    // First delete tickets
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('event_id', eventId);
    
    if (ticketsError) throw ticketsError;
    
    // Then delete event prices
    const { error: priceError } = await supabase
      .from('event_prices')
      .delete()
      .eq('event_id', eventId);
    
    if (priceError) throw priceError;
    
    // Finally delete the event
    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (eventError) throw eventError;
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};