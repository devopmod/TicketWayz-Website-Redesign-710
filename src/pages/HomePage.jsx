import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import HeroSlider from '../components/HeroSlider';
import GenreSelector from '../components/GenreSelector';
import CalendarStrip from '../components/CalendarStrip';
import EventList from '../components/EventList';
import EventGrid from '../components/EventGrid';
import { popularCategories, hotDeals } from '../assets/mockData';

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState({ id: 1, name: 'Все' });

  return (
    <>
      {/* Поисковая строка */}
      <SearchBar />
      
      {/* Hero-слайдер */}
      <HeroSlider />
      
      <div className="container mx-auto max-w-[960px] px-4 py-8">
        {/* Популярные события */}
        <EventList title="Рекомендации для вас" events={hotDeals} />
        
        {/* Фильтры */}
        <div className="flex items-center mb-5">
          <GenreSelector onSelectGenre={setSelectedGenre} />
          {/* ThemeToggle удален */}
        </div>
        
        {/* Календарь-скролл */}
        <CalendarStrip onSelectDate={setSelectedDate} />
        
        {/* Сетка событий */}
        <EventGrid selectedDate={selectedDate} selectedGenre={selectedGenre} />
        
        {/* Категории событий */}
        {popularCategories.map(category => (
          <EventList key={category.id} title={category.name} events={category.events} />
        ))}
      </div>
    </>
  );
};

export default HomePage;