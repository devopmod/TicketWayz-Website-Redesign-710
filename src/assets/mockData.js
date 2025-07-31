// Моковые данные для разработки больше не используются
// Все данные теперь загружаются из базы данных Supabase

// Функция генерации дней для месяца - используется в CalendarStrip
export const generateDaysForMonth = (month, year) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' }).substring(0, 2);
    days.push({
      day: i,
      dayOfWeek,
      date: date.toISOString().split('T')[0],
      active: false
    });
  }
  return days;
};

// Данные для жанров - используются в фильтрах
export const genres = [
  { id: 1, name: 'Все' },
  { id: 2, name: 'Рок' },
  { id: 3, name: 'Поп' },
  { id: 4, name: 'Рэп' },
  { id: 5, name: 'Электронная' },
  { id: 6, name: 'Классика' },
  { id: 7, name: 'Джаз' },
  { id: 8, name: 'Фолк' }
];

// Данные для календаря - используются в CalendarStrip
export const calendarData = {
  months: [
    {
      name: 'Июль',
      days: generateDaysForMonth(6, 2025)
    },
    {
      name: 'Август',
      days: generateDaysForMonth(7, 2025)
    },
    {
      name: 'Сентябрь',
      days: generateDaysForMonth(8, 2025)
    }
  ]
};

// Отмечаем активные дни
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

// Если текущий месяц совпадает с одним из месяцев в calendarData,
// отмечаем текущий день как активный
const monthIndex = currentMonth - 6; // Июль = 6, Август = 7, Сентябрь = 8
if (monthIndex >= 0 && monthIndex < 3 && currentYear === 2025) {
  const currentDay = currentDate.getDate();
  if (currentDay <= calendarData.months[monthIndex].days.length) {
    calendarData.months[monthIndex].days[currentDay - 1].active = true;
  }
}