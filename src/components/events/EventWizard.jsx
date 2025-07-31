import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import supabase from '../../lib/supabase';
import { createEventTickets } from '../../services/ticketService';

const { FiSave, FiX, FiAlertCircle, FiCheck, FiCalendar, FiMapPin, FiDollarSign, FiImage, FiInfo } = FiIcons;

// Main Event Wizard Component
const EventWizard = ({ onCancel, eventToEdit = null, onEventSaved }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('basic-info');
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ticketsInfo, setTicketsInfo] = useState(null);

  // Form data
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'concert',
    artist: '',
    genre: '',
    location: '',
    event_date: new Date().toISOString().slice(0, 16), // Format for datetime-local
    image: 'https://placehold.co/600x400/333/FFF?text=Event',
    venue_id: null,
    prices: {}
  });

  // References for sections
  const sectionRefs = {
    'basic-info': useRef(null),
    'venue-selection': useRef(null),
    'pricing': useRef(null),
    'review': useRef(null)
  };
  const contentRef = useRef(null);

  // Load venues and categories on component mount
  useEffect(() => {
    fetchVenues();
    fetchCategories();
    // Load event data if editing
    if (eventToEdit) {
      loadEventData(eventToEdit);
    }
  }, [eventToEdit]);

  // Set up intersection observer for scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveSection(id);
          }
        });
      },
      {
        root: contentRef.current,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0
      }
    );

    // Observe all section elements
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  // Scroll to section when activeSection changes
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    sectionRefs[sectionId].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch venues from database
  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues');
    }
  };

  // Fetch seat categories from database
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load seat categories');
    }
  };

  // Load event data if editing an existing event
  const loadEventData = async (event) => {
    try {
      console.log("Loading event data for editing:", event);
      
      // Set basic event data with proper date formatting
      const formattedEventData = {
        ...event,
        // Ensure date is properly formatted for datetime-local input
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        // Ensure all fields have default values
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'concert',
        artist: event.artist || '',
        genre: event.genre || '',
        location: event.location || '',
        image: event.image || 'https://placehold.co/600x400/333/FFF?text=Event',
        venue_id: event.venue_id || null,
        prices: {}
      };

      console.log("Formatted event data:", formattedEventData);
      setEventData(formattedEventData);

      // Fetch event prices if we have an event ID
      if (event.id) {
        const { data: priceData, error: priceError } = await supabase
          .from('event_prices')
          .select('*')
          .eq('event_id', event.id);

        if (priceError) throw priceError;

        const prices = {};
        priceData?.forEach(price => {
          prices[price.category_id] = price.price;
        });

        setEventData(prev => ({
          ...prev,
          prices
        }));
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      setError('Failed to load event data');
    }
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle venue selection
  const handleVenueSelect = (venueId) => {
    setEventData(prev => ({
      ...prev,
      venue_id: venueId
    }));
  };

  // Handle price changes
  const handlePriceChange = (categoryId, price) => {
    setEventData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [categoryId]: parseFloat(price) || 0
      }
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    if (!eventData.title.trim()) {
      setError('Event title is required');
      scrollToSection('basic-info');
      return false;
    }

    if (!eventData.description.trim()) {
      setError('Event description is required');
      scrollToSection('basic-info');
      return false;
    }

    if (!eventData.location.trim()) {
      setError('Event location is required');
      scrollToSection('basic-info');
      return false;
    }

    if (eventData.venue_id) {
      // Check if venue has categories and if all have prices
      const selectedVenue = venues.find(v => v.id === eventData.venue_id);
      if (selectedVenue && selectedVenue.geometry_data) {
        const venueData = typeof selectedVenue.geometry_data === 'string' 
          ? JSON.parse(selectedVenue.geometry_data) 
          : selectedVenue.geometry_data;

        const venueCategories = Object.keys(venueData.categories || {});
        
        // Get category IDs from database that match the venue category names
        const requiredCategoryIds = categories
          .filter(c => venueCategories.includes(c.name))
          .map(c => c.id);

        for (const catId of requiredCategoryIds) {
          if (!eventData.prices[catId] || eventData.prices[catId] <= 0) {
            setError(`Price required for all seat categories`);
            scrollToSection('pricing');
            return false;
          }
        }
      }
    } else {
      // General admission event needs at least one price
      if (Object.keys(eventData.prices).length === 0) {
        setError('At least one price category is required');
        scrollToSection('pricing');
        return false;
      }
    }

    return true;
  };

  // Save event to database
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setTicketsInfo(null);

      // Format event date - ensure it's in ISO format
      let formattedDate = eventData.event_date;
      if (typeof formattedDate === 'string' && !formattedDate.includes('T')) {
        formattedDate = `${formattedDate}T18:00:00.000Z`; // Default to 6pm
      } else if (typeof formattedDate === 'string' && formattedDate.includes('T') && !formattedDate.includes('Z')) {
        formattedDate = `${formattedDate}:00.000Z`; // Add seconds and timezone
      }

      // Prepare event data
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        artist: eventData.artist || null,
        genre: eventData.genre || null,
        location: eventData.location,
        event_date: formattedDate,
        image: eventData.image,
        venue_id: eventData.venue_id || null,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        prices: eventData.prices
      };

      if (!eventToEdit) {
        eventPayload.created_at = new Date().toISOString();
      }

      // Update or insert event
      let eventId = eventToEdit?.id;
      let savedEvent;

      if (eventId) {
        // Update existing event
        const { data: updatedEvent, error: updateError } = await supabase
          .from('events')
          .update({
            title: eventPayload.title,
            description: eventPayload.description,
            category: eventPayload.category,
            artist: eventPayload.artist,
            genre: eventPayload.genre,
            location: eventPayload.location,
            event_date: eventPayload.event_date,
            image: eventPayload.image,
            venue_id: eventPayload.venue_id,
            updated_at: eventPayload.updated_at,
            status: 'draft' // Set to draft before creating tickets
          })
          .eq('id', eventId)
          .select()
          .single();

        if (updateError) throw updateError;
        savedEvent = updatedEvent;

        // Delete existing prices
        const { error: deleteError } = await supabase
          .from('event_prices')
          .delete()
          .eq('event_id', eventId);

        if (deleteError) throw deleteError;

        // Insert new prices
        if (Object.keys(eventData.prices).length > 0) {
          const priceInserts = Object.entries(eventData.prices).map(([categoryId, price]) => ({
            event_id: eventId,
            category_id: categoryId,
            price: price,
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
        if (savedEvent.venue_id) {
          try {
            console.log('Creating tickets for event:', eventId);
            const ticketsResult = await createEventTickets(eventId);
            console.log('Tickets creation result:', ticketsResult);
            
            if (ticketsResult && ticketsResult.length > 0) {
              setTicketsInfo(ticketsResult);
            } else {
              throw new Error('No tickets were created');
            }
          } catch (ticketError) {
            console.error('Error recreating tickets:', ticketError);
            setError(`Event updated but failed to recreate tickets: ${ticketError.message}`);
          }
        }

      } else {
        // Insert new event
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert({
            title: eventPayload.title,
            description: eventPayload.description,
            category: eventPayload.category,
            artist: eventPayload.artist,
            genre: eventPayload.genre,
            location: eventPayload.location,
            event_date: eventPayload.event_date,
            image: eventPayload.image,
            venue_id: eventPayload.venue_id,
            status: 'draft', // Start as draft
            published_at: eventPayload.published_at,
            created_at: eventPayload.created_at,
            updated_at: eventPayload.updated_at
          })
          .select()
          .single();

        if (insertError) throw insertError;
        eventId = newEvent.id;
        savedEvent = newEvent;

        // Handle event prices
        if (eventId && Object.keys(eventData.prices).length > 0) {
          const priceInserts = Object.entries(eventData.prices).map(([categoryId, price]) => ({
            event_id: eventId,
            category_id: categoryId,
            price: price,
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
        if (savedEvent.venue_id) {
          try {
            console.log('Creating tickets for new event:', eventId);
            const ticketsResult = await createEventTickets(eventId);
            console.log('Tickets creation result:', ticketsResult);
            
            if (ticketsResult && ticketsResult.length > 0) {
              setTicketsInfo(ticketsResult);
            } else {
              throw new Error('No tickets were created');
            }
          } catch (ticketError) {
            console.error('Error creating tickets:', ticketError);
            setError(`Event created but failed to create tickets: ${ticketError.message}`);
          }
        }
      }

      // Show success message
      setSuccess(true);

      // Call callback if provided to refresh events list
      if (onEventSaved) {
        onEventSaved(savedEvent);
      }

      // Close wizard after short delay
      setTimeout(() => {
        onCancel();
      }, 2000);

    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.message || 'Failed to save event');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get selected venue
  const selectedVenue = venues.find(v => v.id === eventData.venue_id);

  // Parse venue data to get categories
  const getVenueCategories = () => {
    if (!selectedVenue || !selectedVenue.geometry_data) return [];

    try {
      const venueData = typeof selectedVenue.geometry_data === 'string' 
        ? JSON.parse(selectedVenue.geometry_data) 
        : selectedVenue.geometry_data;

      const categoryNames = Object.keys(venueData.categories || {});
      return categories.filter(c => categoryNames.includes(c.name));
    } catch (e) {
      console.error('Error parsing venue data:', e);
      return [];
    }
  };

  // Get venue categories
  const venueCategories = getVenueCategories();

  // Menu items for the scroll spy
  const menuItems = [
    { id: 'basic-info', label: 'Basic Information', icon: FiInfo },
    { id: 'venue-selection', label: 'Venue Selection', icon: FiMapPin },
    { id: 'pricing', label: 'Pricing', icon: FiDollarSign },
    { id: 'review', label: 'Review & Save', icon: FiCheck }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-7xl max-h-[90vh] bg-zinc-900 rounded-lg shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Sidebar and Main Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Scroll Spy Menu */}
          <div className="w-64 border-r border-zinc-700 bg-zinc-800 p-4 flex-shrink-0">
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <SafeIcon icon={item.icon} className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-zinc-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                  saving 
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                }`}
              >
                <SafeIcon icon={FiSave} className="w-5 h-5 mr-2" />
                {saving ? 'Publishing...' : 'Publish Event'}
              </button>
              {eventData.venue_id && (
                <p className="text-xs text-zinc-400 mt-2 text-center">
                  This will create tickets automatically
                </p>
              )}
            </div>
          </div>

          {/* Main Content Area - Scrollable */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-12">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
                <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 mr-2" />
                  <span>Event published successfully!</span>
                </div>
                {ticketsInfo && (
                  <div className="text-sm text-green-300 mt-2">
                    <p>✓ {ticketsInfo[0]?.tickets_created || 0} tickets created</p>
                    <p>✓ {ticketsInfo[0]?.seats_created || 0} seat tickets</p>
                    <p>✓ {ticketsInfo[0]?.zones_created || 0} zone tickets</p>
                  </div>
                )}
              </div>
            )}

            {/* Basic Information Section */}
            <section id="basic-info" ref={sectionRefs['basic-info']} className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-zinc-700 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Event Date & Time *
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiCalendar} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={eventData.event_date}
                      onChange={(e) => handleChange('event_date', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Location *
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiMapPin} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={eventData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      placeholder="City, Venue"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={eventData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="concert">Concert</option>
                    <option value="party">Party</option>
                    <option value="bustour">Bus Tour</option>
                    <option value="theater">Theater</option>
                    <option value="sport">Sport</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Artist */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={eventData.artist || ''}
                    onChange={(e) => handleChange('artist', e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Artist name (optional)"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={eventData.genre || ''}
                    onChange={(e) => handleChange('genre', e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Genre (optional)"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={eventData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Describe your event..."
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Cover Image URL
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <SafeIcon icon={FiImage} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={eventData.image}
                          onChange={(e) => handleChange('image', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter URL for event cover image or use a placeholder
                      </p>
                    </div>
                    {eventData.image && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={eventData.image}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/600x400/333/FFF?text=Error';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Venue Selection Section */}
            <section id="venue-selection" ref={sectionRefs['venue-selection']} className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-zinc-700 pb-2">
                Venue Selection
              </h3>

              <div className="space-y-4">
                <p className="text-gray-400">
                  Select a venue for your event or choose "No Venue" for general admission events.
                </p>

                {/* No Venue Option */}
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    !eventData.venue_id 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-zinc-600 hover:border-zinc-500'
                  }`}
                  onClick={() => handleVenueSelect(null)}
                >
                  <h4 className="text-lg font-medium text-white">No Venue (General Admission)</h4>
                  <p className="text-gray-400 text-sm">
                    Create an event without specific seating arrangements
                  </p>
                </div>

                {/* Venue Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venues.map(venue => (
                    <div
                      key={venue.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        eventData.venue_id === venue.id 
                          ? 'border-yellow-500 bg-yellow-500/10' 
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                      onClick={() => handleVenueSelect(venue.id)}
                    >
                      <h4 className="text-lg font-medium text-white">{venue.name || 'Unnamed Venue'}</h4>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {venue.address || 'No address provided'}
                      </p>
                    </div>
                  ))}
                </div>

                {venues.length === 0 && (
                  <div className="text-center p-8 bg-zinc-800 rounded-lg">
                    <p className="text-gray-400">No venues available. Create venues first.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" ref={sectionRefs['pricing']} className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-zinc-700 pb-2">
                Event Pricing
              </h3>

              <div className="space-y-4">
                <p className="text-gray-400">
                  Set prices for each category in your event.
                </p>

                {selectedVenue ? (
                  <>
                    <h4 className="text-lg font-medium text-white">
                      Pricing for: {selectedVenue.name}
                    </h4>
                    {venueCategories.length > 0 ? (
                      <div className="space-y-3">
                        {venueCategories.map(category => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700"
                          >
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: category.color || '#3B82F6' }}
                              />
                              <div>
                                <div className="text-white">{category.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">€</span>
                              <input
                                type="number"
                                value={eventData.prices[category.id] || ''}
                                onChange={(e) => handlePriceChange(category.id, e.target.value)}
                                min="0"
                                step="0.01"
                                className="w-24 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-4 rounded-lg">
                        <p>This venue has no seat categories configured. Please add categories to the venue first.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-lg font-medium text-white">General Admission Pricing</h4>
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div>
                        <div className="text-white">General Admission</div>
                        <div className="text-sm text-gray-400">Standard ticket price</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">€</span>
                        <input
                          type="number"
                          value={eventData.prices.general || ''}
                          onChange={(e) => handlePriceChange('general', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-24 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {/* Optional: Add more general ticket types */}
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div>
                        <div className="text-white">VIP</div>
                        <div className="text-sm text-gray-400">Premium ticket price (optional)</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">€</span>
                        <input
                          type="number"
                          value={eventData.prices.vip || ''}
                          onChange={(e) => handlePriceChange('vip', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-24 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Review Section */}
            <section id="review" ref={sectionRefs['review']} className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-zinc-700 pb-2">
                Review & Publish
              </h3>

              <div className="bg-zinc-800 p-6 rounded-lg space-y-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Event Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white ml-2">{eventData.title || '(Not set)'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white ml-2">{formatDate(eventData.event_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white ml-2">{eventData.location || '(Not set)'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white ml-2 capitalize">{eventData.category || '(Not set)'}</span>
                    </div>
                    {eventData.artist && (
                      <div>
                        <span className="text-gray-400">Artist:</span>
                        <span className="text-white ml-2">{eventData.artist}</span>
                      </div>
                    )}
                    {eventData.genre && (
                      <div>
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-white ml-2">{eventData.genre}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-700">
                  <h4 className="font-medium text-white mb-3">Venue & Pricing</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Venue:</span>
                      <span className="text-white ml-2">
                        {selectedVenue ? selectedVenue.name : 'General Admission (No Venue)'}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h5 className="text-gray-400 mb-2">Pricing:</h5>
                      {selectedVenue ? (
                        venueCategories.length > 0 ? (
                          <div className="space-y-1">
                            {venueCategories.map(category => (
                              <div key={category.id} className="flex justify-between">
                                <span>{category.name}:</span>
                                <span>€{eventData.prices[category.id] || '0.00'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-yellow-400">No categories configured for this venue</span>
                        )
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>General Admission:</span>
                            <span>€{eventData.prices.general || '0.00'}</span>
                          </div>
                          {eventData.prices.vip && (
                            <div className="flex justify-between">
                              <span>VIP:</span>
                              <span>€{eventData.prices.vip}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {eventData.venue_id && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-200 mb-1">🎫 Automatic Ticket Creation</h4>
                    <p className="text-xs text-blue-200/80">
                      Publishing this event will automatically create tickets based on the selected venue's seating layout.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                    saving 
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  }`}
                >
                  <SafeIcon icon={FiSave} className="w-5 h-5 mr-2" />
                  {saving ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventWizard;