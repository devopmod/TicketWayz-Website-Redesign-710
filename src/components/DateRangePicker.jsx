import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { FiCalendar, FiX } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingStart, setSelectingStart] = useState(true);
  const calendarRef = useRef(null);

  // Генерируем календарь на текущий и следующий месяц
  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Возвращаем данные для двух месяцев
    return [
      generateMonthData(currentMonth, currentYear),
      generateMonthData(currentMonth + 1, currentYear)
    ];
  };

  // Генерирует данные для одного месяца
  const generateMonthData = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Получаем название месяца
    const monthName = new Date(year, month).toLocaleString('ru-RU', { month: 'long' });

    // Создаем массив для дней
    const days = [];

    // Добавляем пустые ячейки для дней до начала месяца
    // Воскресенье - 0, поэтому для российского календаря (где понедельник - 1)
    // нужно скорректировать индекс
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return { month: monthName, year, days };
  };

  const [calendar, setCalendar] = useState(generateCalendar());

  // Обработчик клика вне календаря
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Функция для выбора даты
  const handleDateClick = (date) => {
    if (!date) return;

    if (selectingStart || !startDate) {
      // Выбираем начальную дату
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      // Выбираем конечную дату
      if (date < startDate) {
        // Если конечная дата раньше начальной, меняем их местами
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setSelectingStart(true);
      setIsOpen(false);
    }
  };

  // Функция для отображения выбранного диапазона
  const isInRange = (date) => {
    if (!date || !startDate) return false;
    if (!endDate && hoverDate) {
      return date >= startDate && date <= hoverDate;
    }
    return date >= startDate && date <= (endDate || startDate);
  };

  // Функция для отображения начала/конца диапазона
  const isStartOrEnd = (date) => {
    if (!date) return false;
    return (
      (startDate && date.getTime() === startDate.getTime()) ||
      (endDate && date.getTime() === endDate.getTime())
    );
  };

  // Функция для форматирования отображаемой даты
  const formatDateDisplay = (date) => {
    if (!date) return '';
    return format(date, 'dd.MM.yyyy');
  };

  // Функция для сброса выбранных дат
  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectingStart(true);
  };

  // Функция для обработки наведения на дату
  const handleDateHover = (date) => {
    if (!selectingStart && startDate && date) {
      setHoverDate(date);
    }
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-700 rounded-lg p-2">
        <div className="flex-1 flex items-center" onClick={() => setIsOpen(!isOpen)}>
          <SafeIcon icon={FiCalendar} className="text-zinc-600 dark:text-zinc-400 mr-2" />
          <span className="text-sm text-zinc-900 dark:text-white">
            {startDate ? (
              <>
                {formatDateDisplay(startDate)}
                {endDate ? ` - ${formatDateDisplay(endDate)}` : ''}
              </>
            ) : (
              'Выберите даты'
            )}
          </span>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={clearDates}
            className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
          >
            <SafeIcon icon={FiX} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-2 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[300px]">
          <div className="mb-2 text-center">
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {selectingStart ? 'Выберите начальную дату' : 'Выберите конечную дату'}
            </span>
          </div>

          {calendar.map((month, monthIndex) => (
            <div key={monthIndex} className="mb-4">
              <div className="text-center font-medium mb-2 text-zinc-900 dark:text-white">
                {month.month} {month.year}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className="text-xs text-zinc-600 dark:text-zinc-400 py-1">
                    {day}
                  </div>
                ))}

                {month.days.map((date, index) => (
                  <div
                    key={index}
                    className={`
                      p-1 text-center text-sm rounded-md cursor-pointer
                      ${!date ? 'invisible' : ''}
                      ${isStartOrEnd(date) ? 'bg-yellow-500 text-black' : ''}
                      ${isInRange(date) && !isStartOrEnd(date) ? 'bg-yellow-500/20' : ''}
                      ${date && !isInRange(date) && !isStartOrEnd(date) ? 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white' : ''}
                    `}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => handleDateHover(date)}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;