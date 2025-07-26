import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(true);

  // Инициализация темы при монтировании компонента
  useEffect(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем начальную тему
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setDarkMode(initialDarkMode);
    applyTheme(initialDarkMode);
  }, []);

  // Функция применения темы
  const applyTheme = (isDark) => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      // Применяем темную тему
      root.classList.add('dark');
      root.classList.remove('light');
      body.style.backgroundColor = '#18181b';
      body.style.color = '#ffffff';
      // Сохраняем в localStorage
      localStorage.setItem('theme', 'dark');
    } else {
      // Применяем светлую тему
      root.classList.remove('dark');
      root.classList.add('light');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#000000';
      // Сохраняем в localStorage
      localStorage.setItem('theme', 'light');
    }
  };

  // Функция переключения темы
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
      aria-label={darkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
      title={darkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <SafeIcon icon={darkMode ? FiSun : FiMoon} className="text-lg text-yellow-400" />
    </button>
  );
};

export default ThemeToggle;