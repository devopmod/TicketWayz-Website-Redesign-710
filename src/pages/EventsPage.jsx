import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiSearch, FiList, FiGrid, FiUser } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import EventCard from '../components/EventCard';
import EventListItem from '../components/EventListItem';
import { events, genres } from '../assets/mockData';
import DateRangePicker from '../components/DateRangePicker';

const EventsPage = () => {
  const navigate = useNavigate();
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' или 'list'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    artists: [],
    genres: [],
    locations: [],
    priceRange: { min: 0, max: 200 }
  });

  // Получаем уникальные значения для фильтров
  const categories = [...new Set(events.map(e => e.category))];
  const artists = [...new Set(events.map(e => e.artist))];
  const eventGenres = [...new Set(events.map(e => e.genre))];
  const locations = [...new Set(events.map(e => e.location))];

  // Находим минимальную и максимальную цену
  const minPrice = Math.min(...events.map(e => e.price));
  const maxPrice = Math.max(...events.map(e => e.price));

  useEffect(() => {
    let filtered = [...events];

    // Поиск по названию, артисту или местоположению
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по категориям
    if (filters.categories.length > 0) {
      filtered = filtered.filter(event => filters.categories.includes(event.category));
    }

    // Фильтр по исполнителям
    if (filters.artists.length > 0) {
      filtered = filtered.filter(event => filters.artists.includes(event.artist));
    }

    // Фильтр по жанрам
    if (filters.genres.length > 0) {
      filtered = filtered.filter(event => filters.genres.includes(event.genre));
    }

    // Фильтр по местоположению
    if (filters.locations.length > 0) {
      filtered = filtered.filter(event => filters.locations.includes(event.location));
    }

    // Фильтр по диапазону цен
    filtered = filtered.filter(event =>
      event.price >= filters.priceRange.min && event.price <= filters.priceRange.max
    );

    // Фильтр по диапазону дат
    if (startDate && endDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      });
    } else if (startDate) {
      filtered = filtered.filter(event => new Date(event.date) >= startDate);
    } else if (endDate) {
      filtered = filtered.filter(event => new Date(event.date) <= endDate);
    }

    // Сортировка по дате
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredEvents(filtered);
  }, [searchQuery, filters, startDate, endDate]);

  const handleCheckboxChange = (filterType, value, isChecked) => {
    setFilters(prev => {
      if (isChecked) {
        return { ...prev, [filterType]: [...prev[filterType], value] };
      } else {
        return { ...prev, [filterType]: prev[filterType].filter(item => item !== value) };
      }
    });
  };

  const handleSelectAll = (filterType, values, isChecked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: isChecked ? values : []
    }));
  };

  const handlePriceRangeChange = (min, max) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      artists: [],
      genres: [],
      locations: [],
      priceRange: { min: minPrice, max: maxPrice }
    });
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'concert': return 'Концерт';
      case 'party': return 'Вечеринка';
      case 'bustour': return 'Автобусный тур';
      default: return category;
    }
  };

  const getGenreLabel = (genre) => {
    switch (genre) {
      case 'pop': return 'Поп';
      case 'dance': return 'Танцы';
      case 'transport': return 'Транспорт';
      default: return genre;
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'concert': return 'bg-purple-100 text-purple-700';
      case 'party': return 'bg-pink-100 text-pink-700';
      case 'bustour': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGenreBadgeColor = (genre) => {
    switch (genre) {
      case 'pop': return 'bg-yellow-100 text-yellow-700';
      case 'dance': return 'bg-green-100 text-green-700';
      case 'transport': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const CheckboxGroup = ({ title, items, selectedItems, filterType, itemLabelFn }) => (
    <div className="mb-6">
      <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">{title}</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`${filterType}-all`}
            checked={selectedItems.length === items.length}
            onChange={(e) => handleSelectAll(filterType, items, e.target.checked)}
            className="mr-2 accent-yellow-500 h-4 w-4 cursor-pointer"
          />
          <label htmlFor={`${filterType}-all`} className="text-zinc-900 dark:text-white">Все</label>
        </div>
        {items.sort().map((item) => (
          <div key={item} className="flex items-center">
            <input
              type="checkbox"
              id={`${filterType}-${item}`}
              checked={selectedItems.includes(item)}
              onChange={(e) => handleCheckboxChange(filterType, item, e.target.checked)}
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

  const FilterSidebar = ({ className = '', hideTitle = false }) => (
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
        {/* Категория */}
        <CheckboxGroup
          title="Категория концерта"
          items={categories}
          selectedItems={filters.categories}
          filterType="categories"
          itemLabelFn={getCategoryLabel}
        />

        {/* Исполнитель */}
        <CheckboxGroup
          title="Исполнитель"
          items={artists}
          selectedItems={filters.artists}
          filterType="artists"
        />

        {/* Жанр */}
        <CheckboxGroup
          title="Жанр"
          items={eventGenres}
          selectedItems={filters.genres}
          filterType="genres"
          itemLabelFn={getGenreLabel}
        />

        {/* Диапазон дат */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Диапазон дат</h3>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Город */}
        <CheckboxGroup
          title="Город"
          items={locations}
          selectedItems={filters.locations}
          filterType="locations"
        />

        {/* Диапазон цен */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Цена</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-900 dark:text-white">{filters.priceRange.min} €</span>
            <span className="text-zinc-900 dark:text-white">{filters.priceRange.max} €</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={filters.priceRange.max}
            onChange={(e) => handlePriceRangeChange(filters.priceRange.min, parseInt(e.target.value))}
            className="w-full accent-yellow-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-[960px] px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Десктопные фильтры */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <FilterSidebar />
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex-1">
          {/* Заголовок и поиск */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Каталог событий</h1>
            </div>

            {/* Поиск */}
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-zinc-600 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Поиск событий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Результаты */}
          <div className="mb-4">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Найдено событий: {filteredEvents.length}
            </p>

            {/* Кнопки управления */}
            <div className="flex items-center justify-between">
              {/* Кнопка фильтров слева */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition lg:hidden"
              >
                <SafeIcon icon={FiFilter} />
                <span>Фильтры</span>
              </button>

              {/* Кнопки переключения вида справа */}
              <div className="flex rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                  aria-label="Вид карточек"
                >
                  <SafeIcon icon={FiGrid} className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                  aria-label="Вид списка"
                >
                  <SafeIcon icon={FiList} className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Сетка или список событий */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full cursor-pointer"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <div className="relative h-44 w-full mb-3">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent opacity-70 rounded-bl-lg rounded-br-lg"></div>
                    
                    {/* Бейджи */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(event.category)}`}>
                        {getCategoryLabel(event.category)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGenreBadgeColor(event.genre)}`}>
                        {getGenreLabel(event.genre)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{event.title}</h3>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">от €{event.price}</div>
                  </div>

                  <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    <SafeIcon icon={FiUser} className="mr-1 text-yellow-400" />
                    <span>{event.artist}</span>
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(event.date).toLocaleDateString('ru-RU', {
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
              {filteredEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <EventListItem event={event} />
                </motion.div>
              ))}
            </div>
          )}

          {filteredEvents.length === 0 && (
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
        </div>
      </div>

      {/* Мобильные фильтры */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden"
            >
              <div className="h-full bg-white dark:bg-zinc-900 p-4 overflow-y-auto scrollbar-custom">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Фильтры</h3>
                  <button
                    onClick={() => setShowFilters(false)}
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