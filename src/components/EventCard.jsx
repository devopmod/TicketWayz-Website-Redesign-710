import React from 'react';
import {useNavigate} from 'react-router-dom';
import {FiUser} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const EventCard=({event,size="large"})=> {
  const navigate=useNavigate();

  const formatDate=(dateString)=> {
    const options={day: '2-digit',month: 'long',year: 'numeric'};
    return new Date(dateString).toLocaleDateString('ru-RU',options);
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

  const handleCardClick=()=> {
    navigate(`/event/${event.id}`);
  };

  const accentColor=event?.accent_color || event?.accent || '#f59e0b';

  if (size==="large") {
    return (
      <div className="flex-shrink-0 flex-grow-0 w-60 min-w-[240px] mr-6 mb-3 cursor-pointer" onClick={handleCardClick}>
        <div className="relative h-44 w-full">
          <img 
            src={event.image} 
            alt={event.title} 
            className="h-full w-full object-cover rounded-lg" 
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent opacity-70 rounded-bl-lg rounded-br-lg"></div>
          
          {/* Бейджи */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(event.category)}`}>
              {getCategoryLabel(event.category)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGenreBadgeColor(event.genre)}`}>
              {getGenreLabel(event.genre)}
            </span>
          </div>
        </div>
        
        <div className="mt-3 mb-1.5">
          <p className="text-zinc-900 dark:text-white leading-tight font-medium">{event.title}</p>
        </div>
        
        <div className="flex items-center text-xs text-zinc-500 dark:text-neutral-500 mb-1">
          <SafeIcon icon={FiUser} className="mr-1 text-yellow-400" />
          <span>{event.artist}</span>
        </div>

        {event.venue && (
          <div className="mb-1">
            <div className="text-[13px] font-medium" style={{color: accentColor}}>
              {event.venue.name}
            </div>
            {(event.venue.address || event.address) && (
              <div className="text-[12px] text-gray-500">
                {event.venue.address || event.address}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center">
          <span className="text-zinc-500 dark:text-neutral-500 text-xs">
            {formatDate(event.date)} • {event.location}
          </span>
        </div>
      </div>
    );
  }

  // Компактная версия карточки (для календарного грида) с фиксированным размером 256px × 96px
  return (
    <div className="flex w-[256px] h-[96px] cursor-pointer flex-shrink-0 bg-white dark:bg-zinc-900" onClick={handleCardClick}>
      <div className="w-20 h-20 flex-shrink-0 relative">
        <img 
          src={event.image} 
          alt={event.title} 
          className="h-20 w-20 object-cover rounded-xl" 
        />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent opacity-70 rounded-bl-lg rounded-br-lg"></div>
      </div>
      
      <div className="pl-3 flex-1 overflow-hidden">
        <h6 className="font-medium mb-1 leading-tight truncate text-zinc-900 dark:text-white">{event.title}</h6>
        
        <div className="flex items-center text-xs text-zinc-500 dark:text-neutral-500 mb-1">
          <SafeIcon icon={FiUser} className="mr-1 text-yellow-400 text-xs" />
          <span className="truncate">{event.artist}</span>
        </div>

        {event.venue && (
          <div className="mb-1">
            <div className="text-[13px] font-medium truncate" style={{color: accentColor}}>
              {event.venue.name}
            </div>
            {(event.venue.address || event.address) && (
              <div className="text-[12px] text-gray-500 truncate">
                {event.venue.address || event.address}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center">
          <span className="text-zinc-500 dark:text-neutral-500 text-xs block truncate">{formatDate(event.date)}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
