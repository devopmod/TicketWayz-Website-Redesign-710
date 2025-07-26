import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiUser, FiArrowLeft } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { events } from '../assets/mockData';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки данных
    setLoading(true);
    // Находим событие по ID
    const foundEvent = events.find(e => e.id === id);
    setTimeout(() => {
      setEvent(foundEvent);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleBuyTickets = () => {
    // Переход на страницу с выбором места
    navigate(`/venue/${id}`);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
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

  if (loading) {
    return (
      <div className="container mx-auto max-w-[960px] px-4 py-16 flex justify-center">
        <div className="animate-pulse flex flex-col w-full">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6"></div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-6"></div>
          <div className="h-12 bg-yellow-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto max-w-[960px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Событие не найдено</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">Запрошенное событие не существует или было удалено.</p>
        <button
          onClick={() => navigate('/events')}
          className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
        >
          Просмотреть все события
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-64 md:h-80 relative max-w-[960px] mx-auto">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>

        {/* Бейджи на изображении - обновлены стили */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(event.category)}`}>
            {getCategoryLabel(event.category)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGenreBadgeColor(event.genre)}`}>
            {getGenreLabel(event.genre)}
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-[960px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">{event.title}</h1>

          {/* Артист с иконкой */}
          <div className="mb-4 flex items-center">
            <SafeIcon icon={FiUser} className="text-yellow-400 mr-2" />
            <span className="text-lg font-medium text-zinc-900 dark:text-white">{event.title}</span>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <SafeIcon icon={FiCalendar} className="text-yellow-400" />
              <span className="text-zinc-900 dark:text-white">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <SafeIcon icon={FiMapPin} className="text-yellow-400" />
              <span className="text-zinc-900 dark:text-white">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <SafeIcon icon={FiClock} className="text-yellow-400" />
              <span className="text-zinc-900 dark:text-white">19:00</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">Описание события</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              {event.genre === 'pop' ? (
                <>
                  Впервые в {event.location}! Долгожданный концерт {event.title}!
                  Незабываемое шоу с лучшими хитами и новыми композициями.
                  Не упустите шанс увидеть любимого исполнителя вживую!
                </>
              ) : event.genre === 'dance' ? (
                <>
                  Грандиозная вечеринка {event.title} в самом сердце {event.location}!
                  Лучшие диджеи, невероятные световые шоу и атмосфера полного отрыва.
                  Танцуем до утра!
                </>
              ) : event.genre === 'transport' ? (
                <>
                  Комфортабельный автобусный тур {event.title}. Отправление в 08:00 из центра города.
                  Возвращение на следующий день. В стоимость входит трансфер в обе стороны и помощь в размещении.
                </>
              ) : (
                <>
                  {event.title} - уникальное событие, которое нельзя пропустить!
                  Подробная информация будет доступна ближе к дате мероприятия. Следите за обновлениями.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">от</span>
                <span className="text-2xl font-bold ml-2 text-zinc-900 dark:text-white">€{event.price}</span>
              </div>
            </div>
            <button
              onClick={handleBuyTickets}
              className="w-full px-6 py-4 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium text-lg"
            >
              Купить билеты
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default EventDetailPage;