import { format, parseISO } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

const localeMap = {
  'en-US': enUS,
  'ru-RU': ru
};

export function formatDateTime(dateInput, localeCode = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US') {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
    if (isNaN(date)) {
      return { date: String(dateInput), time: '', dateTime: String(dateInput) };
    }
    const locale = localeMap[localeCode] || localeMap['en-US'];
    return {
      date: format(date, 'P', { locale }),
      time: format(date, 'p', { locale }),
      dateTime: format(date, 'Pp', { locale })
    };
  } catch {
    return { date: String(dateInput), time: '', dateTime: String(dateInput) };
  }
}

export default formatDateTime;
