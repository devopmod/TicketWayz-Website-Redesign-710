import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const EventListItem = ({ event }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
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

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div
      className="flex border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4 cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition p-2 rounded-lg"
      onClick={handleCardClick}
    >
      <div className="w-20 h-20 flex-shrink-0">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover rounded-lg"
        />
      </div>

      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium text-zinc-900 dark:text-white">{event.title}</h3>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">от €{event.price}</div>
        </div>

        <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          <SafeIcon icon={FiUser} className="mr-1 text-yellow-400" />
          <span>{event.artist}</span>
        </div>

        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          {formatDate(event.date)} • {event.location}
        </div>

        <div className="flex flex-wrap gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(event.category)}`}>
            {getCategoryLabel(event.category)}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGenreBadgeColor(event.genre)}`}>
            {getGenreLabel(event.genre)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventListItem;