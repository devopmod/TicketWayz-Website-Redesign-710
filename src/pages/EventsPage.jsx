import React,{useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion,AnimatePresence} from 'framer-motion';
import {FiFilter,FiX,FiSearch,FiList,FiGrid,FiUser} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import EventCard from '../components/EventCard';
import EventListItem from '../components/EventListItem';
import DateRangePicker from '../components/DateRangePicker';
import {fetchEvents} from '../services/eventService';

const EventsPage=()=> {
  const navigate=useNavigate();
  const [events,setEvents]=useState([]);
  const [filteredEvents,setFilteredEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showFilters,setShowFilters]=useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const [viewMode,setViewMode]=useState('grid'); // 'grid' or 'list'
  const [startDate,setStartDate]=useState(null);
  const [endDate,setEndDate]=useState(null);

  // Filter states
  const [filters,setFilters]=useState({
    categories: [],
    artists: [],
    genres: [],
    locations: [],
    priceRange: {min: 0,max: 200}
  });

  // Load events
  useEffect(()=> {
    const loadEvents=async ()=> {
      try {
        setLoading(true);
        setError(null);
        const eventsData=await fetchEvents();
        
        if (eventsData) {
          setEvents(eventsData);
          setFilteredEvents(eventsData);
          
          // Set price range based on actual prices
          if (eventsData.length > 0) {
            const prices=eventsData
              .map(e=> e.price || 0)
              .filter(price=> price > 0);
            
            if (prices.length > 0) {
              const minPrice=Math.floor(Math.min(...prices));
              const maxPrice=Math.ceil(Math.max(...prices));
              setFilters(prev=> ({
                ...prev,
                priceRange: {min: minPrice,max: maxPrice}
              }));
            }
          }
        } else {
          setEvents([]);
          setFilteredEvents([]);
        }
      } catch (err) {
        console.error('Error loading events:',err);
        setError('Failed to load events');
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  },[]);

  // Get unique values for filters
  const categories=[...new Set(events.map(e=> e.category))].filter(Boolean);
  const artists=[...new Set(events.map(e=> e.artist))].filter(Boolean);
  const eventGenres=[...new Set(events.map(e=> e.genre))].filter(Boolean);
  const locations=[...new Set(events.map(e=> e.location))].filter(Boolean);

  // Find min and max prices from actual event data
  const minPrice=events.length > 0 ? Math.floor(Math.min(...events.map(e=> e.price || 0).filter(price=> price > 0))) : 0;
  const maxPrice=events.length > 0 ? Math.ceil(Math.max(...events.map(e=> e.price || 0))) : 200;

  // Apply filters when filter state changes
  useEffect(()=> {
    let filtered=[...events];

    // Search by title,artist or location
    if (searchQuery) {
      filtered=filtered.filter(event=>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.artist && event.artist.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered=filtered.filter(event=> filters.categories.includes(event.category));
    }

    // Filter by artists
    if (filters.artists.length > 0) {
      filtered=filtered.filter(event=> event.artist && filters.artists.includes(event.artist));
    }

    // Filter by genres
    if (filters.genres.length > 0) {
      filtered=filtered.filter(event=> event.genre && filters.genres.includes(event.genre));
    }

    // Filter by locations
    if (filters.locations.length > 0) {
      filtered=filtered.filter(event=> event.location && filters.locations.includes(event.location));
    }

    // Filter by price range
    filtered=filtered.filter(event=> {
      const price=event.price || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Filter by date range
    if (startDate && endDate) {
      filtered=filtered.filter(event=> {
        const eventDate=new Date(event.event_date);
        return eventDate >= startDate && eventDate <= endDate;
      });
    } else if (startDate) {
      filtered=filtered.filter(event=> new Date(event.event_date) >= startDate);
    } else if (endDate) {
      filtered=filtered.filter(event=> new Date(event.event_date) <= endDate);
    }

    // Sort by date
    filtered.sort((a,b)=> new Date(a.event_date) - new Date(b.event_date));

    setFilteredEvents(filtered);
  },[searchQuery,filters,startDate,endDate,events]);

  // Filter handlers
  const handleCheckboxChange=(filterType,value,isChecked)=> {
    setFilters(prev=> {
      if (isChecked) {
        return {...prev,[filterType]: [...prev[filterType],value]};
      } else {
        return {...prev,[filterType]: prev[filterType].filter(item=> item !== value)};
      }
    });
  };

  const handleSelectAll=(filterType,values,isChecked)=> {
    setFilters(prev=> ({
      ...prev,
      [filterType]: isChecked ? values : []
    }));
  };

  const handlePriceRangeChange=(min,max)=> {
    setFilters(prev=> ({
      ...prev,
      priceRange: {min,max}
    }));
  };

  const clearFilters=()=> {
    setFilters({
      categories: [],
      artists: [],
      genres: [],
      locations: [],
      priceRange: {min: minPrice,max: maxPrice}
    });
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
  };

  // Helper functions for category and genre labels
  const getCategoryLabel=(category)=> {
    switch (category) {
      case 'concert': return 'Концерт';
      case 'party': return 'Вечеринка';
      case 'bustour': return 'Автобусный тур';
      default: return category;
    }
  };

  const getGenreLabel=(genre)=> {
    switch (genre) {
      case 'pop': return 'Поп';
      case 'dance': return 'Танцы';
      case 'transport': return 'Транспорт';
      default: return genre;
    }
  };

  const getCategoryBadgeColor=(category)=> {
    switch (category) {
      case 'concert': return 'bg-purple-100 text-purple-700';
      case 'party': return 'bg-pink-100 text-pink-700';
      case 'bustour': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGenreBadgeColor=(genre)=> {
    switch (genre) {
      case 'pop': return 'bg-yellow-100 text-yellow-700';
      case 'dance': return 'bg-green-100 text-green-700';
      case 'transport': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format price with proper decimal places
  const formatPrice=(price)=> {
    return price ? Number(price).toFixed(2) : '0.00';
  };

  // Checkbox filter group component
  const CheckboxGroup=({title,items,selectedItems,filterType,itemLabelFn})=> (
    <div className="mb-6">
      <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">{title}</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`${filterType}-all`}
            checked={selectedItems.length === items.length}
            onChange={(e)=> handleSelectAll(filterType,items,e.target.checked)}
            className="mr-2 accent-yellow-500 h-4 w-4 cursor-pointer"
          />
          <label htmlFor={`${filterType}-all`} className="text-zinc-900 dark:text-white">Все</label>
        </div>
        {items.sort().map((item)=> (
          <div key={item} className="flex items-center">
            <input
              type="checkbox"
              id={`${filterType}-${item}`}
              checked={selectedItems.includes(item)}
              onChange={(e)=> handleCheckboxChange(filterType,item,e.target.checked)}
              className="mr-2 accent-yellow-500 h-4 w-4 cursor-pointer"
            />
            <label htmlFor={`${filterType}-${item}`} className="text-zinc-900 dark:text-white">
              {itemLabelFn ? itemLabelFn(item) : item}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  // Filter sidebar component
  const FilterSidebar=({className='',hideTitle=false})=> (
    <div className={`${className}`}>
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-900 dark:text-white">Фильтры</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-yellow-500 hover:underline"
          >
            Очистить все
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Category */}
        {categories.length > 0 && (
          <CheckboxGroup
            title="Категория концерта"
            items={categories}
            selectedItems={filters.categories}
            filterType="categories"
            itemLabelFn={getCategoryLabel}
          />
        )}

        {/* Artist */}
        {artists.length > 0 && (
          <CheckboxGroup
            title="Исполнитель"
            items={artists}
            selectedItems={filters.artists}
            filterType="artists"
          />
        )}

        {/* Genre */}
        {eventGenres.length > 0 && (
          <CheckboxGroup
            title="Жанр"
            items={eventGenres}
            selectedItems={filters.genres}
            filterType="genres"
            itemLabelFn={getGenreLabel}
          />
        )}

        {/* Date range */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Диапазон дат</h3>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Location */}
        {locations.length > 0 && (
          <CheckboxGroup
            title="Город"
            items={locations}
            selectedItems={filters.locations}
            filterType="locations"
          />
        )}

        {/* Price range */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Цена</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-900 dark:text-white">{formatPrice(filters.priceRange.min)} €</span>
            <span className="text-zinc-900 dark:text-white">{formatPrice(filters.priceRange.max)} €</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={filters.priceRange.max}
            onChange={(e)=> handlePriceRangeChange(filters.priceRange.min,parseInt(e.target.value))}
            className="w-full accent-yellow-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-[960px] px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <FilterSidebar />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Header and search */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Каталог событий</h1>
            </div>

            {/* Search */}
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-zinc-600 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Поиск событий..."
                value={searchQuery}
                onChange={(e)=> setSearchQuery(e.target.value)}
                className="w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_,i)=> (
                <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Найдено событий: {filteredEvents.length}
                </p>

                {/* Control buttons */}
                <div className="flex items-center justify-between">
                  {/* Filter button (left) */}
                  <button
                    onClick={()=> setShowFilters(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition lg:hidden"
                  >
                    <SafeIcon icon={FiFilter} />
                    <span>Фильтры</span>
                  </button>

                  {/* View toggle buttons (right) */}
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={()=> setViewMode('grid')}
                      className={`p-2 ${viewMode==='grid' ? 'bg-yellow-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                      aria-label="Вид карточек"
                    >
                      <SafeIcon icon={FiGrid} className="text-lg" />
                    </button>
                    <button
                      onClick={()=> setViewMode('list')}
                      className={`p-2 ${viewMode==='list' ? 'bg-yellow-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                      aria-label="Вид списка"
                    >
                      <SafeIcon icon={FiList} className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Event grid or list */}
              {filteredEvents.length > 0 ? (
                viewMode==='grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event=> (
                      <motion.div
                        key={event.id}
                        initial={{opacity: 0,y: 20}}
                        animate={{opacity: 1,y: 0}}
                        transition={{duration: 0.3}}
                        className="w-full cursor-pointer"
                        onClick={()=> navigate(`/event/${event.id}`)}
                      >
                        <div className="relative h-44 w-full mb-3">
                          <img
                            src={event.image || `https://placehold.co/600x400/333/FFF?text=${encodeURIComponent(event.title)}`}
                            alt={event.title}
                            className="h-full w-full object-cover rounded-lg"
                            onError={(e)=> {
                              e.target.src=`https://placehold.co/600x400/333/FFF?text=${encodeURIComponent(event.title)}`;
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent opacity-70 rounded-bl-lg rounded-br-lg"></div>
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(event.category)}`}>
                              {getCategoryLabel(event.category)}
                            </span>
                            {event.genre && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGenreBadgeColor(event.genre)}`}>
                                {getGenreLabel(event.genre)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{event.title}</h3>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">
                            от €{formatPrice(event.price)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                          <SafeIcon icon={FiUser} className="mr-1 text-yellow-400" />
                          <span>{event.artist || event.title}</span>
                        </div>
                        
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(event.event_date).toLocaleDateString('ru-RU',{
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} • {event.location}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map(event=> (
                      <motion.div
                        key={event.id}
                        initial={{opacity: 0,y: 10}}
                        animate={{opacity: 1,y: 0}}
                        transition={{duration: 0.2}}
                      >
                        <EventListItem event={{
                          id: event.id,
                          title: event.title,
                          location: event.location,
                          date: event.event_date,
                          image: event.image || `https://placehold.co/600x400/333/FFF?text=${encodeURIComponent(event.title)}`,
                          category: event.category,
                          genre: event.genre,
                          artist: event.artist || event.title,
                          price: event.price
                        }} />
                      </motion.div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    Событий не найдено
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={()=> setShowFilters(false)}
            />
            <motion.div
              initial={{x: '-100%'}}
              animate={{x: 0}}
              exit={{x: '-100%'}}
              transition={{type: 'tween',duration: 0.3}}
              className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden"
            >
              <div className="h-full bg-white dark:bg-zinc-900 p-4 overflow-y-auto scrollbar-custom">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Фильтры</h3>
                  <button
                    onClick={()=> setShowFilters(false)}
                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <SafeIcon icon={FiX} />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-yellow-500 hover:underline"
                  >
                    Очистить все
                  </button>
                </div>
                <FilterSidebar hideTitle={true} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsPage;