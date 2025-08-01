import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const WEEK_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(new Date()));
  const pickerRef = useRef(null);

  // Закрыть при клике снаружи
  useEffect(() => {
    const handle = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Данные для двух последовательных месяцев
  const months = useMemo(() => {
    return [0, 1].map((offset) => {
      const monthStart = startOfMonth(addMonths(displayMonth, offset));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const prefix = (monthStart.getDay() + 6) % 7; // сдвиг, чтобы Пн был первым
      const padded = Array(prefix).fill(null).concat(days);
      return { monthStart, days: padded };
    });
  }, [displayMonth]);

  // Проверки диапазона
  const isInRange = (date) => {
    if (!date || !startDate) return false;
    if (endDate) return isWithinInterval(date, { start: startDate, end: endDate });
    if (hoverDate) {
      const start = isBefore(hoverDate, startDate) ? hoverDate : startDate;
      const end = isAfter(hoverDate, startDate) ? hoverDate : startDate;
      return isWithinInterval(date, { start, end });
    }
    return isSameDay(date, startDate);
  };

  const isBoundary = (date) =>
    date && ((startDate && isSameDay(date, startDate)) || (endDate && isSameDay(date, endDate)));

  const handleDateClick = (date) => {
    if (!date) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (isBefore(date, startDate)) {
      setEndDate(startDate);
      setStartDate(date);
      setIsOpen(false);
    } else if (isSameDay(date, startDate)) {
      setStartDate(null);
      setEndDate(null);
    } else {
      setEndDate(date);
      setIsOpen(false);
    }
  };

  const clear = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  };

  const formatDisplay = (d) => (d ? format(d, 'dd.MM.yyyy') : '');

  return (
    <div className="relative" ref={pickerRef}>
      {/* Поле ввода */}
      <div
        className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-700 rounded-lg p-2 cursor-pointer"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center">
          <SafeIcon icon={FiCalendar} className="text-zinc-600 dark:text-zinc-400 mr-2" />
          <span className="text-sm text-zinc-900 dark:text-white">
            {startDate ? (
              <>
                {formatDisplay(startDate)}
                {endDate && ` - ${formatDisplay(endDate)}`}
              </>
            ) : (
              'Выберите даты'
            )}
          </span>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
          >
            <SafeIcon icon={FiX} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Календарь */}
      {isOpen && (
        <div className="absolute z-20 mt-2 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[640px]">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-3">
            <button
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {format(displayMonth, 'LLLL yyyy', { locale: ru })} —{' '}
              {format(addMonths(displayMonth, 1), 'LLLL yyyy', { locale: ru })}
            </span>
            <button
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
            >
              <FiChevronRight />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {months.map(({ monthStart, days }, idx) => (
              <div key={idx}>
                <div className="text-center font-medium mb-2 capitalize text-zinc-900 dark:text-white">
                  {format(monthStart, 'LLLL yyyy', { locale: ru })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEK_LABELS.map((l) => (
                    <div key={l} className="text-xs text-zinc-600 dark:text-zinc-400 py-1">
                      {l}
                    </div>
                  ))}
                  {days.map((d, i) => (
                    <div
                      key={i}
                      onClick={() => handleDateClick(d)}
                      onMouseEnter={() => setHoverDate(d)}
                      className={`p-1 text-sm rounded-md ${
                        !d ? 'invisible' : 'cursor-pointer'
                      } ${
                        isBoundary(d)
                          ? 'bg-yellow-500 text-black'
                          : isInRange(d)
                          ? 'bg-yellow-500/20'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                      }`}
                    >
                      {d ? format(d, 'd') : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
