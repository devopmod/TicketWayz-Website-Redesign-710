import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const CalendarStrip = ({ onSelectDate }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollContainerRef = useRef(null);

  // Генерируем 60 дней начиная с сегодняшнего дня
  const generateDates = (startDate) => {
    const dates = [];
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2);
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const dateString = date.toISOString().split('T')[0];
      dates.push({ date: dateString, day, dayOfWeek, month, fullDate: date });
    }
    return dates;
  };

  const [dates, setDates] = useState(() => generateDates(new Date()));

  // Обновляем даты в полночь
  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      setCurrentDate(now);
      setDates(generateDates(now));
    };

    // Проверяем каждую минуту, не наступила ли полночь
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateDates();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Выделяем сегодняшнюю дату по умолчанию
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!selectedDate) {
      setSelectedDate(today);
      onSelectDate(today);
    }
  }, [selectedDate, onSelectDate]);

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);
    onSelectDate(dateString);
  };

  // Группируем даты по месяцам для отображения заголовков
  const groupedDates = dates.reduce((acc, dateObj) => {
    const month = dateObj.month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(dateObj);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative max-w-[960px] mx-auto">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide pb-4 hide-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex whitespace-nowrap">
          {Object.entries(groupedDates).map(([month, monthDates]) => (
            <div key={month} className="inline-block">
              <h3 className="text-zinc-900 dark:text-white font-bold ml-4 mb-2 py-1">
                {month}
              </h3>
              <div className="flex">
                {monthDates.map((dateObj) => (
                  <button
                    key={dateObj.date}
                    onClick={() => handleDateSelect(dateObj.date)}
                    className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg transition-colors relative ${
                      selectedDate === dateObj.date
                        ? 'bg-yellow-400 text-black'
                        : 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-lg font-medium">{dateObj.day}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {dateObj.dayOfWeek}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarStrip;