import React,{useState,useEffect} from 'react';
import SearchBar from '../components/SearchBar';
import HeroSlider from '../components/HeroSlider';
import GenreSelector from '../components/GenreSelector';
import CalendarStrip from '../components/CalendarStrip';
import EventList from '../components/EventList';
import EventGrid from '../components/EventGrid';
import {fetchEvents} from '../services/eventService';

const HomePage=()=> {
  const [selectedDate,setSelectedDate]=useState(null);
  const [selectedGenre,setSelectedGenre]=useState({id: 1,name: 'Все'});
  const [recentEvents,setRecentEvents]=useState([]);
  const [popularCategories,setPopularCategories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [allEvents,setAllEvents]=useState([]);

  // Load events from database
  useEffect(()=> {
    const loadEvents=async ()=> {
      try {
        setLoading(true);
        const eventsData=await fetchEvents();
        
        if (eventsData && eventsData.length > 0) {
          // Format events for display with REAL prices
          const formattedEvents=eventsData.map(event=> ({
            id: event.id,
            title: event.title,
            location: event.location,
            date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            image: event.image || 'https://placehold.co/600x400/333/FFF?text=Event',
            category: event.category || 'concert',
            genre: event.genre || 'pop',
            artist: event.artist || event.title,
            description: event.description,
            // USE REAL PRICE from database instead of hardcoded 75
            price: event.price || 0, // This comes from fetchEvents() with minimum price
            prices: event.prices || [] // All price categories
          }));

          setAllEvents(formattedEvents);

          // Get the 4 most recent events for recommendations
          const recent=[...formattedEvents]
            .sort((a,b)=> new Date(b.date) - new Date(a.date))
            .slice(0,4);
          setRecentEvents(recent);

          // Group events by category
          const categories=[];
          // Get unique categories
          const uniqueCategories=[...new Set(formattedEvents.map(event=> event.category))];

          // Create category groups
          uniqueCategories.forEach((category,index)=> {
            const categoryEvents=formattedEvents.filter(event=> event.category===category);
            if (categoryEvents.length > 0) {
              let categoryName='';
              switch (category) {
                case 'concert': categoryName='Концерты';break;
                case 'party': categoryName='Вечеринки';break;
                case 'bustour': categoryName='Автобусные туры';break;
                default: categoryName=category.charAt(0).toUpperCase() + category.slice(1);
              }

              categories.push({
                id: index + 1,
                name: categoryName,
                events: categoryEvents.slice(0,4)
              });
            }
          });

          setPopularCategories(categories);
        } else {
          setRecentEvents([]);
          setPopularCategories([]);
        }
      } catch (error) {
        console.error('Error loading events:',error);
        setRecentEvents([]);
        setPopularCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  },[]);

  return (
    <>
      {/* Поисковая строка */}
      <SearchBar />

      {/* Hero-слайдер */}
      <HeroSlider />

      <div className="container mx-auto max-w-[960px] px-4 py-8">
        {/* Популярные события */}
        {loading ? (
          <div className="mb-12">
            <div className="mb-5">
              <h6 className="text-sm font-medium uppercase text-zinc-900 dark:text-white">
                Рекомендации для вас
              </h6>
            </div>
            <div className="flex space-x-6">
              {[...Array(4)].map((_,i)=> (
                <div key={i} className="w-60 min-w-[240px] animate-pulse">
                  <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-3"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded mb-1"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : recentEvents.length > 0 ? (
          <EventList title="Рекомендации для вас" events={recentEvents} />
        ) : (
          <div className="mb-12 text-center p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <h6 className="text-sm font-medium uppercase text-zinc-900 dark:text-white mb-2">
              Рекомендации для вас
            </h6>
            <p className="text-zinc-600 dark:text-zinc-400">
              Пока нет доступных событий. Создайте новые события в панели администратора.
            </p>
          </div>
        )}

        {/* Фильтры */}
        <div className="flex items-center mb-5">
          <GenreSelector onSelectGenre={setSelectedGenre} />
        </div>

        {/* Календарь-скролл */}
        <CalendarStrip onSelectDate={setSelectedDate} />

        {/* Сетка событий */}
        <EventGrid 
          selectedDate={selectedDate} 
          selectedGenre={selectedGenre} 
          events={allEvents} 
        />

        {/* Категории событий */}
        {popularCategories.map(category=> (
          <EventList
            key={category.id}
            title={category.name}
            events={category.events}
          />
        ))}

        {popularCategories.length===0 && !loading && (
          <div className="text-center p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg mt-8">
            <p className="text-zinc-600 dark:text-zinc-400">
              Нет доступных категорий событий. Добавьте больше событий для отображения по категориям.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;