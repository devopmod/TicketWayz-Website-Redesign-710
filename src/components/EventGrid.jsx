import React, { useState, useEffect, useRef } from 'react';
import EventCard from './EventCard';
import { events } from '../assets/mockData';

const EventGrid = ({ selectedDate, selectedGenre }) => {
  const [filteredEvents, setFilteredEvents] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let filtered = [...events];

    // Сортируем события по дате
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Фильтрация по дате - показываем события от выбранной даты и позже
    if (selectedDate) {
      filtered = filtered.filter(event => event.date >= selectedDate);
    } else {
      // Если дата не выбрана, показываем только будущие события
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(event => event.date >= today);
    }

    // Фильтрация по жанру
    if (selectedGenre && selectedGenre.id !== 1) {
      // id=1 это "Все"
      filtered = filtered.filter(
        event => event.genre.toLowerCase() === selectedGenre.name.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  }, [selectedDate, selectedGenre]);

  // Организуем события в колонки по 3 в каждой
  const organizeEventsInColumns = (events) => {
    const columns = [];
    const totalColumns = Math.ceil(events.length / 3);

    for (let col = 0; col < totalColumns; col++) {
      const columnEvents = [];
      for (let row = 0; row < 3; row++) {
        const eventIndex = col * 3 + row;
        if (eventIndex < events.length) {
          columnEvents.push(events[eventIndex]);
        }
      }
      columns.push(columnEvents);
    }
    return columns;
  };

  const eventColumns = organizeEventsInColumns(filteredEvents);

  return (
    <div className="mb-12">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto hide-scrollbar pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          height: '312px' // Фиксированная высота на 3 карточки (96px * 3 + отступы)
        }}
      >
        <div className="flex min-w-min h-full">
          {eventColumns.map((column, colIndex) => (
            <div key={`col-${colIndex}`} className="flex flex-col mr-4 h-full justify-start">
              {column.map((event, rowIndex) => (
                <div key={event.id} className="mb-4">
                  <EventCard event={event} size="small" />
                </div>
              ))}

              {/* Заполняем пустое место если в колонке меньше 3 событий */}
              {column.length < 3 && Array(3 - column.length).fill().map((_, emptyIndex) => (
                <div
                  key={`empty-${colIndex}-${emptyIndex}`}
                  className="mb-4"
                  style={{ height: '96px' }}
                ></div>
              ))}
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="w-full text-center py-8 text-gray-400 flex items-center justify-center h-full">
              Нет событий, соответствующих выбранным фильтрам
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventGrid;