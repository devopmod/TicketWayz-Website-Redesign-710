import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import VenuePage from './pages/VenuePage';
import CheckoutPage from './pages/CheckoutPage';
import ThankYouPage from './pages/ThankYouPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  const location = useLocation();

  // Прокрутка к верху при смене страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Инициализация темы при загрузке приложения
  useEffect(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем начальную тему
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    // Применяем тему
    const root = document.documentElement;
    const body = document.body;

    if (initialDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.style.backgroundColor = '#18181b';
      body.style.color = '#ffffff';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#000000';
    }
    
    // Сохраняем выбранную тему в localStorage, если её не было
    if (!savedTheme) {
      localStorage.setItem('theme', initialDarkMode ? 'dark' : 'light');
    }
  }, []);

  // Не показывать хедер и футер на странице благодарности
  const isThankYouPage = location.pathname.includes('/thank-you');

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
      {!isThankYouPage && <Header />}
      <main className={!isThankYouPage ? "pt-11" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/venue/:id" element={<VenuePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isThankYouPage && <Footer />}
    </div>
  );
}

export default App;