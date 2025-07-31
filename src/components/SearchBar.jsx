import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { fetchEvents } from '../services/eventService';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load events once
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await fetchEvents();
        
        if (eventsData) {
          setAllEvents(eventsData);
        }
      } catch (error) {
        console.error('Error loading events for search:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  // Filter events on query change
  useEffect(() => {
    if (query.length > 0) {
      const filtered = allEvents.filter(event => 
        event.title.toLowerCase().includes(query.toLowerCase()) || 
        event.location?.toLowerCase().includes(query.toLowerCase()) ||
        event.artist?.toLowerCase().includes(query.toLowerCase())
      );
      
      setFilteredEvents(filtered.slice(0, 4)); // Max 4 events in dropdown
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [query, allEvents]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = (event) => {
    navigate(`/event/${event.id}`);
    setIsDropdownOpen(false);
    setQuery('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="w-full px-4 py-2" ref={dropdownRef}>
      <div className="relative max-w-[960px] mx-auto">
        <div className="flex items-center bg-zinc-100/70 dark:bg-white/10 backdrop-blur-sm rounded-full px-4 h-11">
          <input
            type="text"
            placeholder="Поиск по исполнителю, событию или месту"
            className="bg-transparent text-zinc-900 dark:text-white w-full focus:outline-none placeholder-zinc-600 dark:placeholder-zinc-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SafeIcon icon={FiSearch} className="text-yellow-400 text-xl" />
        </div>

        {/* Dropdown results */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
            {loading ? (
              <div className="px-4 py-2 text-zinc-900 dark:text-white">Загрузка...</div>
            ) : filteredEvents.length > 0 ? (
              <ul>
                {filteredEvents.map(event => (
                  <li
                    key={event.id}
                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div className="text-zinc-900 dark:text-white">{event.title}</div>
                    <div className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {event.location}, {formatDate(event.event_date)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-2 text-zinc-900 dark:text-white">Не найдено</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;