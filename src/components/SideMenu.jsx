import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHome, FiCalendar, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ThemeToggle from './ThemeToggle';

const SideMenu = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState('RU');
  const navigate = useNavigate();

  const menuItems = [
    { icon: FiHome, label: 'Главная', path: '/' },
    { icon: FiCalendar, label: 'События', path: '/events' },
    { icon: FiSettings, label: 'Админ', path: '/admin' },
  ];

  const languages = ['RU', 'EN', 'PL'];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Side menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-[382px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white z-50 rounded-l-lg"
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-1 rounded ${
                      language === lang
                        ? 'bg-yellow-500 text-black'
                        : 'text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition"
                aria-label="Close menu"
              >
                <SafeIcon icon={FiX} className="text-2xl" />
              </button>
            </div>

            <div className="p-4">
              <ul className="space-y-4">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="flex items-center gap-3 p-2 w-full text-left hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition"
                    >
                      <SafeIcon icon={item.icon} className="text-xl" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}

                {/* Переключатель темы в меню */}
                <li className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <div className="flex items-center gap-3 p-2">
                    <span className="text-xl">🎨</span>
                    <span>Тема</span>
                    <div className="ml-auto">
                      <ThemeToggle />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideMenu;