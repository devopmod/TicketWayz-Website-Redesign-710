import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { heroSlides } from '../assets/mockData';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Автоматическая смена слайдов
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-[400px] w-full max-w-[960px] mx-auto overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img 
            src={heroSlides[currentSlide].image} 
            alt={heroSlides[currentSlide].title}
            className="w-full h-full object-cover"
          />
          
          {/* Затемнение снизу */}
          <div className="absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-center h-full px-4">
              <h2 className="text-white font-bold text-xl">
                {heroSlides[currentSlide].title}
              </h2>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Индикаторы слайдов */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {heroSlides.map((_, index) => (
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
    </div>
  );
};

export default HeroSlider;