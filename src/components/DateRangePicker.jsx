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

/**
 * Адаптивный DateRangePicker
 * • width: 100%/90vw на мобилке, max-w 640 px на desktop
 * • Листаем месяцы ←/→; на xs (<640 px) показывается 1 месяц, на sm + — 2 месяца
 * • Окно открывается модальным слоем по центру, закрывается кликом вне области или по Esc
 */
const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(new Date()));
  const triggerRef = useRef(null);

  // ───────────────────────── helpers ─────────────────────────
  const months = useMemo(() => {
    const makeMonth = (offset) => {
      const monthStart = startOfMonth(addMonths(displayMonth, offset));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const prefix = (monthStart.getDay() + 6) % 7; // понедельник — 0
      return {
        monthStart,
        days: Array(prefix).fill(null).concat(days),
      };
    };
    return [makeMonth(0), makeMonth(1)];
  }, [displayMonth]);

  const isInRange = (date) => {
    if (!date || !startDate) return false;
    if (endDate) return isWithinInterval(date, { start: startDate, end: endDate });
    if (hoverDate) {
      const [start, end] = isBefore(hoverDate, startDate)
        ? [hoverDate, startDate]
        : [startDate, hoverDate];
      return isWithinInterval(date, { start, end });
    }
    return isSameDay(date, startDate);
  };

  const isBoundary = (d) => d && ((startDate && isSameDay(d, startDate)) || (endDate && isSameDay(d, endDate)));

  const clear = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  };

  const handleDateClick = (d) => {
    if (!d) return;

    // 1-й клик или «начинаем заново»
    if (!startDate || endDate) {
      setStartDate(d);
      setEndDate(null);
      return; // остаёмся открытыми до второго клика
    }

    // 2-й клик
    if (isBefore(d, startDate)) {
      setEndDate(startDate);
      setStartDate(d);
    } else if (!isSameDay(d, startDate)) {
      setEndDate(d);
    }

    setIsOpen(false); // теперь можно закрыть
  };

  // ───────────────────────── close on esc / outside ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const fmt = (d) => (d ? format(d, 'dd.MM.yyyy') : '');

  // ───────────────────────── render ─────────────────────────
  return (
    <>
      {/* Триггер */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-700 rounded-lg p-2 cursor-pointer w-full"
      >
        <div className="flex items-center">
          <SafeIcon icon={FiCalendar} className="text-zinc-600 dark:text-zinc-400 mr-2" />
          <span className="text-sm text-zinc-900 dark:text-white whitespace-nowrap">
            {startDate ? (
              <>
                {fmt(startDate)}
                {endDate && ` – ${fmt(endDate)}`}
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
            className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600"
          >
            <SafeIcon icon={FiX} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* затемнение */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

          {/* календарь */}
          <div className="relative z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[90vw] max-w-[640px] p-4">
            {/* навигация */}
            <div className="flex items-center justify-between mb-3">
              <button
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                {format(displayMonth, 'LLLL yyyy', { locale: ru })}
                {' — '}
                {format(addMonths(displayMonth, 1), 'LLLL yyyy', { locale: ru })}
              </span>
              <button
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      )}
    </>
  );
};

export default DateRangePicker;
