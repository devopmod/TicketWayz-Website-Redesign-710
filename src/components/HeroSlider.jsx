import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchEvents } from '../services/eventService';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load events for slider
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        
        // Use the first 5 events for the slider
        if (eventsData && eventsData.length > 0) {
          const slideEvents = eventsData
            .slice(0, 5)
            .map(event => ({
              id: event.id,
              title: event.title,
              image: event.image || 'https://placehold.co/1200x400/333/FFF?text=' + encodeURIComponent(event.title)
            }));
          
          setSlides(slideEvents);
        } else {
          // Fallback if no events are available
          setSlides([{
            id: 'placeholder',
            title: 'Нет доступных событий',
            image: 'https://placehold.co/1200x400/333/FFF?text=Нет+доступных+событий'
          }]);
        }
      } catch (error) {
        console.error('Error loading events for slider:', error);
        // Fallback on error
        setSlides([{
          id: 'error',
          title: 'Ошибка загрузки событий',
          image: 'https://placehold.co/1200x400/333/FFF?text=Ошибка+загрузки+событий'
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Auto-change slides
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleSlideClick = (slide) => {
    if (slide.id !== 'placeholder' && slide.id !== 'error') {
      navigate(`/event/${slide.id}`);
    }
  };

  if (loading) {
    return (
      <div className="relative h-[400px] w-full max-w-[960px] mx-auto overflow-hidden bg-zinc-200 dark:bg-zinc-800 animate-pulse">
        <div className="absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-between items-center h-full px-4">
            <div className="w-1/3 h-6 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full max-w-[960px] mx-auto overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div 
          key={currentSlide} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => handleSlideClick(slides[currentSlide])}
        >
          <img 
            src={slides[currentSlide].image} 
            alt={slides[currentSlide].title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://placehold.co/1200x400/333/FFF?text=${encodeURIComponent(slides[currentSlide].title)}`;
            }}
          />
          {/* Затемнение снизу */}
          <div className="absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-center h-full px-4">
              <h2 className="text-white font-bold text-xl">
                {slides[currentSlide].title}
              </h2>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Индикаторы слайдов */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? 'bg-white scale-110' : 'bg-white/50'
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;