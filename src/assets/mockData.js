// Моковые данные для разработки
export const events = [
  {
    id: '1',
    title: 'MAX KORZH',
    location: 'Warszawa',
    date: '2025-08-09',
    image: 'https://placehold.co/600x400/333/FFF?text=MAX+KORZH',
    category: 'concert',
    genre: 'pop',
    artist: 'MAX KORZH',
    description: 'Впервые в Варшаве! Долгожданный концерт MAX KORZH! Незабываемое шоу с лучшими хитами и новыми композициями.',
    price: 75
  },
  {
    id: '2',
    title: 'DVIZH ТУСА',
    location: 'Warszawa',
    date: '2025-08-09',
    image: 'https://placehold.co/600x400/333/FFF?text=DVIZH+TUCA',
    category: 'party',
    genre: 'dance',
    artist: 'DVIZH',
    description: 'Грандиозная вечеринка DVIZH ТУСА в самом сердце Варшавы! Лучшие диджеи, невероятные световые шоу.',
    price: 45
  },
  {
    id: '3',
    title: 'Bustour Riga-Warsaw-Riga',
    location: 'Riga',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Riga',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Риги в Варшаву и обратно. Отправление в 08:00 из центра города.',
    price: 35
  },
  {
    id: '4',
    title: 'Bustour Vilnius-Warsaw-Vilnius',
    location: 'Vilnius',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Vilnius',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Вильнюса в Варшаву и обратно.',
    price: 40
  },
  {
    id: '5',
    title: 'Bustour Leipzig-Warsaw-Leipzig',
    location: 'Leipzig',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Leipzig',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Лейпцига в Варшаву и обратно.',
    price: 50
  },
  {
    id: '6',
    title: 'Bustour Berlin-Warsaw-Berlin',
    location: 'Berlin',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Berlin',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Берлина в Варшаву и обратно.',
    price: 55
  },
  {
    id: '7',
    title: 'Bustour Tallinn-Warsaw-Tallinn',
    location: 'Tallinn',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Tallinn',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Таллина в Варшаву и обратно.',
    price: 45
  },
  {
    id: '8',
    title: 'Bustour Gdansk-Warsaw-Gdansk',
    location: 'Gdansk',
    date: '2025-08-08',
    image: 'https://placehold.co/600x400/333/FFF?text=Bustour+Gdansk',
    category: 'bustour',
    genre: 'transport',
    artist: 'TicketWayz Tours',
    description: 'Комфортабельный автобусный тур из Гданьска в Варшаву и обратно.',
    price: 30
  }
];

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

export const heroSlides = [
  {
    id: 1,
    title: 'MAX KORZH в Варшаве',
    image: 'https://placehold.co/1200x400/333/FFF?text=MAX+KORZH'
  },
  {
    id: 2,
    title: 'DVIZH ТУСА',
    image: 'https://placehold.co/1200x400/333/FFF?text=DVIZH+TUCA'
  },
  {
    id: 3,
    title: 'Bustour Riga-Warsaw-Riga',
    image: 'https://placehold.co/1200x400/333/FFF?text=Bustour+Riga'
  },
  {
    id: 4,
    title: 'Bustour Vilnius-Warsaw-Vilnius',
    image: 'https://placehold.co/1200x400/333/FFF?text=Bustour+Vilnius'
  },
  {
    id: 5,
    title: 'Bustour Leipzig-Warsaw-Leipzig',
    image: 'https://placehold.co/1200x400/333/FFF?text=Bustour+Leipzig'
  }
];

export const popularCategories = [
  {
    id: 1,
    name: 'Концерты',
    events: events.filter(e => e.category === 'concert')
  },
  {
    id: 2,
    name: 'Горящие предложения',
    events: events.filter(e => e.category === 'bustour')
  },
  {
    id: 3,
    name: 'Вечеринки',
    events: events.filter(e => e.category === 'party')
  }
];

export const hotDeals = [
  events[0],
  events[1],
  events[2],
  events[3]
];

export const concerts = [
  events[0],
  events[1]
];

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

// Активируем некоторые дни
calendarData.months[0].days[8].active = true; // 9 июля
calendarData.months[1].days[7].active = true; // 8 августа
calendarData.months[1].days[8].active = true; // 9 августа