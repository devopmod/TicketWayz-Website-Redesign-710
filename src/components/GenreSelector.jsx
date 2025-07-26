import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { genres } from '../assets/mockData';

const GenreSelector = ({ onSelectGenre }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(genres[0]);

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
      >
        <span className="text-xs tracking-wider">{selectedGenre.name}</span>
        <SafeIcon icon={FiChevronDown} className="text-zinc-600 dark:text-zinc-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg z-10 border border-zinc-200 dark:border-zinc-700"
          >
            <ul className="rounded-lg overflow-hidden">
              {genres.map(genre => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenreSelector;