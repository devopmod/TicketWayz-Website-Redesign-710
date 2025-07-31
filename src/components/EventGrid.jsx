import React, {useState, useEffect, useRef} from 'react';
import EventCard from './EventCard';

const EventGrid = ({selectedDate, selectedGenre, events = []}) => {
  const [filteredEvents, setFilteredEvents] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let filtered = [...events];
    
    // Sort events by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Filter by date - show events from selected date and later
    if (selectedDate) {
      filtered = filtered.filter(event => event.date >= selectedDate);
    } else {
      // If date not selected, show only future events
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(event => event.date >= today);
    }
    
    // Filter by genre
    if (selectedGenre && selectedGenre.id !== 1) { // id=1 is "All"
      filtered = filtered.filter(
        event => event.genre && event.genre.toLowerCase() === selectedGenre.name.toLowerCase()
      );
    }
    
    setFilteredEvents(filtered);
  }, [selectedDate, selectedGenre, events]);

  // Organize events in columns of 3 each
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
          height: '320px' // Fixed height for container
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
              {/* Fill empty space if column has fewer than 3 events */}
              {column.length < 3 && Array(3 - column.length).fill().map((_, emptyIndex) => (
                <div key={`empty-${colIndex}-${emptyIndex}`} className="mb-4" style={{height: '96px'}}></div>
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