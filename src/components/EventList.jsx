import React, { useRef } from 'react';
import EventCard from './EventCard';

const EventList = ({ title, events, scrollable = true }) => {
  const scrollContainerRef = useRef(null);

  return (
    <div className="mb-12">
      <div className="mb-5">
        <h6 className="text-sm font-medium uppercase text-zinc-900 dark:text-white">{title}</h6>
      </div>
      <div
        ref={scrollContainerRef}
        className={`${scrollable ? 'overflow-x-auto' : ''} pb-5 hide-scrollbar`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex flex-nowrap min-w-min">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
          
          {/* Если мало событий, добавляем заполнитель */}
          {events.length < 3 && Array(3 - events.length).fill().map((_, i) => (
            <div key={`placeholder-${i}`} className="w-60 min-w-[240px] mr-6"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventList;