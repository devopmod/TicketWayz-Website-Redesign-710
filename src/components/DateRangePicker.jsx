import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  setMonth,
  setYear,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isBefore,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const WEEK_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [...Array(12).keys()].map((i) =>
  format(new Date(2025, i, 1), 'LLLL', { locale: ru })
);

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(new Date()));
  const [awaitingEnd, setAwaitingEnd] = useState(false); // ← добавлено

  const triggerRef = useRef(null);
  const modalRef = useRef(null);

  // ──────────────────────── helpers ────────────────────────
  const months = useMemo(() => {
    const createMonth = (offset) => {
      const monthStart = startOfMonth(addMonths(displayMonth, offset));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const prefix = (monthStart.getDay() + 6) % 7;
      return { monthStart, days: Array(prefix).fill(null).concat(days) };
    };
    return [createMonth(0), createMonth(1)];
  }, [displayMonth]);

  const isInRange = (d) => {
    if (!d || !startDate) return false;
    if (endDate) return isWithinInterval(d, { start: startDate, end: endDate });
    if (hoverDate) {
      const [s, e] = isBefore(hoverDate, startDate) ? [hoverDate, startDate] : [startDate, hoverDate];
      return isWithinInterval(d, { start: s, end: e });
    }
    return isSameDay(d, startDate);
  };

  const isBoundary = (d) =>
    d && ((startDate && isSameDay(d, startDate)) || (endDate && isSameDay(d, endDate)));

  // ──────────────────────── handlers ────────────────────────
  const clear = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    setAwaitingEnd(false);
  };

  const handleDateClick = (d) => {
    if (!d) return;

    // первый клик / перезапуск выбора
    if (!startDate || endDate) {
      setStartDate(d);
      setEndDate(null);
      setAwaitingEnd(true);
      return; // не закрываем модалку
    }

    // второй клик
    if (isBefore(d, startDate)) {
      setEndDate(startDate);
      setStartDate(d);
    } else if (!isSameDay(d, startDate)) {
      setEndDate(d);
    }
    setAwaitingEnd(false);
    setIsOpen(false);
  };

  // close on Esc / outside
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => e.key === 'Escape' && setIsOpen(false);
    const out = (e) => {
      if (
        awaitingEnd // ← блокируем закрытие, ждём конец диапазона
      )
        return;
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      )
        setIsOpen(false);
    };
    document.addEventListener('keydown', esc);
    document.addEventListener('mousedown', out);
    return () => {
      document.removeEventListener('keydown', esc);
      document.removeEventListener('mousedown', out);
    };
  }, [isOpen, awaitingEnd]);

  // month/year select
  const years = useMemo(() => {
    const y = displayMonth.getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - 5 + i);
  }, [displayMonth]);
  const changeMonth = (m) => setDisplayMonth((p) => setMonth(p, m));
  const changeYear = (y) => setDisplayMonth((p) => setYear(p, y));

  const fmt = (d) => (d ? format(d, 'dd.MM.yyyy') : '');

  // ──────────────────────── render ────────────────────────
  return (
    <>
      {/* Trigger */}
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />

          <div
            ref={modalRef}
            className="relative z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[95vw] max-w-[640px] p-4"
          >
            {/* navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
                >
                  <FiChevronLeft />
                </button>
                <button
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
                >
                  <FiChevronRight />
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={displayMonth.getMonth()}
                  onChange={(e) => changeMonth(parseInt(e.target.value, 10))}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded capitalize"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx} className="capitalize">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={displayMonth.getFullYear()}
                  onChange={(e) => changeYear(parseInt(e.target.value, 10))}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded"
                >
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* months grid */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
              {months.map(({ monthStart, days }, idx) => (
                <div key={idx} className="w-full">
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
                        className={`p-1 text-sm rounded-md ${!d ? 'invisible' : 'cursor-pointer'} ${
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
