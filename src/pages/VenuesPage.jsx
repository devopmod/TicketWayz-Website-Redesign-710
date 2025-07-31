import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import supabase from '../lib/supabase';
import VenueDesigner from '../components/venue/VenueDesigner';

const { FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader } = FiIcons;

const VenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [currentVenue, setCurrentVenue] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch venues from database
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVenues(data || []);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const handleCreateVenue = () => {
    setCurrentVenue(null);
    setShowDesigner(true);
  };

  const handleEditVenue = (venue) => {
    setCurrentVenue(venue);
    setShowDesigner(true);
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это место? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setLoading(true);

      // Check if venue is used in any events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('venue_id', venueId)
        .limit(1);

      if (eventsError) throw eventsError;

      if (events && events.length > 0) {
        alert('Это место нельзя удалить, так как оно используется в существующих событиях.');
        return;
      }

      // Delete associated zones
      const { error: zonesError } = await supabase
        .from('zones')
        .delete()
        .eq('venue_id', venueId);

      if (zonesError) throw zonesError;

      // Delete associated single seats
      const { error: seatsError } = await supabase
        .from('single_seats')
        .delete()
        .eq('venue_id', venueId);

      if (seatsError) throw seatsError;

      // Delete venue
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (venueError) throw venueError;

      // Update state
      setVenues(venues.filter(venue => venue.id !== venueId));
      alert('Место успешно удалено!');
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Не удалось удалить место. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVenue = async (venueData, venueId = null) => {
    try {
      setSaving(true);

      // Parse categories and elements from canvas data
      const categories = venueData.canvas_data?.categories || {};
      const elements = venueData.canvas_data?.elements || [];

      // Create or update venue record
      let savedVenue;
      if (venueId) {
        // Update existing venue
        const { data, error } = await supabase
          .from('venues')
          .update({
            name: venueData.name,
            address: venueData.address || '',
            geometry_data: JSON.stringify(venueData.canvas_data),
            updated_at: new Date().toISOString()
          })
          .eq('id', venueId)
          .select()
          .single();

        if (error) throw error;
        savedVenue = data;
      } else {
        // Create new venue
        const { data, error } = await supabase
          .from('venues')
          .insert({
            name: venueData.name,
            address: venueData.address || '',
            geometry_data: JSON.stringify(venueData.canvas_data),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        savedVenue = data;
      }

      // Save seat categories
      for (const [categoryId, categoryData] of Object.entries(categories)) {
        // Check if category exists
        const { data: existingCategories, error: categoryCheckError } = await supabase
          .from('seat_categories')
          .select('id')
          .eq('name', categoryId)
          .limit(1);

        if (categoryCheckError) throw categoryCheckError;

        if (!existingCategories || existingCategories.length === 0) {
          // Create new category
          const { error: categoryError } = await supabase
            .from('seat_categories')
            .insert({
              name: categoryId,
              color: categoryData.color,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (categoryError) throw categoryError;
        }
      }

      // Delete existing zones and seats for this venue if updating
      if (venueId) {
        // Delete zones
        const { error: zonesDeleteError } = await supabase
          .from('zones')
          .delete()
          .eq('venue_id', venueId);

        if (zonesDeleteError) throw zonesDeleteError;

        // Delete seats
        const { error: seatsDeleteError } = await supabase
          .from('single_seats')
          .delete()
          .eq('venue_id', venueId);

        if (seatsDeleteError) throw seatsDeleteError;
      }

      // Save zones and seats
      const zoneElements = elements.filter(el => el.type === 'section' || el.type === 'polygon');
      const seatElements = elements.filter(el => el.type === 'seat');

      // Save zones first
      for (const zone of zoneElements) {
        let categoryId = null;
        if (zone.categoryId) {
          // Lookup category ID
          const { data: categoryData, error: categoryError } = await supabase
            .from('seat_categories')
            .select('id')
            .eq('name', zone.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId = categoryData[0].id;
          }
        }

        // Create zone record
        const { data: zoneData, error: zoneError } = await supabase
          .from('zones')
          .insert({
            venue_id: savedVenue.id,
            category_id: categoryId,
            name: zone.label || `Zone ${zone.id}`,
            capacity: zone.capacity || 1,
            ui_shape: JSON.stringify({
              type: zone.type,
              x: zone.x,
              y: zone.y,
              width: zone.width,
              height: zone.height,
              points: zone.points,
              is_bookable: zone.is_bookable !== false
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (zoneError) throw zoneError;
      }

      // Save single seats
      for (const seat of seatElements) {
        let categoryId = null;
        if (seat.categoryId) {
          // Lookup category ID
          const { data: categoryData, error: categoryError } = await supabase
            .from('seat_categories')
            .select('id')
            .eq('name', seat.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId = categoryData[0].id;
          }
        }

        // Find zone that contains this seat (if any)
        let zoneId = null;

        // Create seat record
        const { error: seatError } = await supabase
          .from('single_seats')
          .insert({
            venue_id: savedVenue.id,
            zone_id: zoneId,
            category_id: categoryId,
            row_number: seat.row || 1,
            seat_number: seat.seat || 1,
            section: seat.section || 'A',
            x: seat.x,
            y: seat.y,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (seatError) throw seatError;
      }

      // Update state
      if (venueId) {
        setVenues(venues.map(v => v.id === venueId ? { ...v, ...savedVenue } : v));
      } else {
        setVenues([savedVenue, ...venues]);
      }

      // Close designer
      setShowDesigner(false);
      setCurrentVenue(null);
      alert(`Место ${venueId ? 'обновлено' : 'создано'} успешно!`);
    } catch (err) {
      console.error('Error saving venue:', err);
      alert('Не удалось сохранить место. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white pt-11">
      <div className="container mx-auto max-w-[960px] px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Места проведения</h1>
          <button
            onClick={handleCreateVenue}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center"
          >
            <SafeIcon icon={FiPlus} className="mr-2" />
            Создать место
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && venues.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <SafeIcon icon={FiLoader} className="animate-spin h-8 w-8 text-yellow-500" />
          </div>
        ) : venues.length === 0 ? (
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 text-center">
            <h2 className="text-xl font-medium mb-2 text-zinc-900 dark:text-white">Пока нет мест</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Создайте первое место для начала управления событиями и рассадкой.
            </p>
            <button
              onClick={handleCreateVenue}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
            >
              Создать первое место
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(venue => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center">
                  <div className="text-5xl text-white opacity-80">🏟️</div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                    {venue.name || 'Без названия'}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {venue.address || 'Адрес не указан'}
                  </p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditVenue(venue)}
                      className="p-2 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                      title="Редактировать"
                    >
                      <SafeIcon icon={FiEdit2} />
                    </button>
                    <button
                      onClick={() => handleDeleteVenue(venue.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                      title="Удалить"
                    >
                      <SafeIcon icon={FiTrash2} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Venue Designer Modal */}
        {showDesigner && (
          <VenueDesigner
            venue={currentVenue}
            onSave={handleSaveVenue}
            onCancel={() => setShowDesigner(false)}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

export default VenuesPage;