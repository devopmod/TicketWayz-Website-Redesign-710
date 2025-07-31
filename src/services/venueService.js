import supabase from '../lib/supabase';

// Fetch all venues
export const fetchVenues = async () => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching venues:', error);
    throw error;
  }
};

// Fetch venue by ID
export const fetchVenueById = async (venueId) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching venue:', error);
    throw error;
  }
};

// Fetch venue categories
export const fetchVenueCategories = async (venueId) => {
  try {
    // Get venue data first
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();
    
    if (venueError) throw venueError;
    
    // Parse geometry_data to get categories
    if (venue && venue.geometry_data) {
      const geometryData = typeof venue.geometry_data === 'string' 
        ? JSON.parse(venue.geometry_data) 
        : venue.geometry_data;
      
      const categoryNames = Object.keys(geometryData.categories || {});
      
      // Get category details from seat_categories table
      if (categoryNames.length > 0) {
        const { data, error } = await supabase
          .from('seat_categories')
          .select('*')
          .in('name', categoryNames);
        
        if (error) throw error;
        return data;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching venue categories:', error);
    throw error;
  }
};