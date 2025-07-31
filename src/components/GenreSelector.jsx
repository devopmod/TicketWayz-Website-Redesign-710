import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { fetchEvents } from '../services/eventService';

const GenreSelector = ({ onSelectGenre }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState([{ id: 1, name: 'Все' }]);
  const [selectedGenre, setSelectedGenre] = useState({ id: 1, name: 'Все' });
  const [loading, setLoading] = useState(true);

  // Load real genres from events
  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true);
        const events = await fetchEvents();
        
        if (events && events.length > 0) {
          // Extract unique genres from events
          const uniqueGenres = [...new Set(
            events
              .map(event => event.genre)
              .filter(genre => genre && genre.trim() !== '')
          )];

          // Create genre objects with proper labels
          const genreObjects = uniqueGenres.map((genre, index) => ({
            id: index + 2, // Start from 2 since "Все" has id 1
            name: getGenreLabel(genre),
            value: genre // Keep original value for filtering
          }));

          // Combine "Все" with real genres
          setGenres([
            { id: 1, name: 'Все' },
            ...genreObjects
          ]);
        }
      } catch (error) {
        console.error('Error loading genres:', error);
        // Fallback to default genres if loading fails
        setGenres([
          { id: 1, name: 'Все' },
          { id: 2, name: 'Поп', value: 'pop' },
          { id: 3, name: 'Танцы', value: 'dance' },
          { id: 4, name: 'Транспорт', value: 'transport' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadGenres();
  }, []);

  // Helper function to get genre label
  const getGenreLabel = (genre) => {
    const genreLabels = {
      'pop': 'Поп',
      'dance': 'Танцы', 
      'transport': 'Транспорт',
      'rock': 'Рок',
      'electronic': 'Электронная',
      'classical': 'Классика',
      'jazz': 'Джаз',
      'folk': 'Фолк',
      'rap': 'Рэп',
      'hip-hop': 'Хип-хоп',
      'reggae': 'Регги',
      'blues': 'Блюз',
      'country': 'Кантри',
      'metal': 'Метал',
      'punk': 'Панк',
      'indie': 'Инди',
      'alternative': 'Альтернатива'
    };
    
    return genreLabels[genre?.toLowerCase()] || 
           (genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Неизвестный');
  };

  const handleSelectGenre = (genre) => {
    setSelectedGenre(genre);
    setIsOpen(false);
    onSelectGenre(genre);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-500/60 bg-white/80 dark:bg-black/10 text-zinc-900 dark:text-white"
        disabled={loading}
      >
        <span className="text-xs tracking-wider">
          {loading ? 'Загрузка...' : selectedGenre.name}
        </span>
        <SafeIcon 
          icon={FiChevronDown} 
          className={`text-zinc-600 dark:text-zinc-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg z-10 border border-zinc-200 dark:border-zinc-700"
          >
            <ul className="rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {genres.map((genre) => (
                <li
                  key={genre.id}
                  className={`px-4 py-2 cursor-pointer transition ${
                    selectedGenre.id === genre.id
                      ? 'bg-yellow-500 text-black'
                      : 'text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                  onClick={() => handleSelectGenre(genre)}
                >
                  {genre.name}
                </li>
              ))}
            </ul>
            
            {/* Show info about loaded genres */}
            {genres.length > 1 && (
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
                Найдено жанров: {genres.length - 1}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenreSelector;