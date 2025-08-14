import React,{useState,useEffect} from 'react';
import {useParams,useNavigate} from 'react-router-dom';
import {motion,AnimatePresence} from 'framer-motion';
import {FiInfo,FiX,FiArrowLeft,FiTrash2,FiShoppingCart} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import {fetchEventById} from '../services/eventService';
import {fetchVenueById} from '../services/venueService';
import {getEventTickets,getTicketsStatistics,getTicketPrice,getTicketCategory} from '../services/ticketService';
import VenueSeatingChart from '../components/venue/VenueSeatingChart';

const VenuePage=()=> {
const {id}=useParams();
const navigate=useNavigate();
const [event,setEvent]=useState(null);
const [venue,setVenue]=useState(null);
const [loading,setLoading]=useState(true);
const [selectedSeats,setSelectedSeats]=useState([]);
const [showInfo,setShowInfo]=useState(false);
const [error,setError]=useState(null);
const [tickets,setTickets]=useState([]);
const [ticketStats,setTicketStats]=useState({total: 0,available: 0,held: 0,sold: 0});
const [showCart,setShowCart]=useState(false);
const [categoryPrices,setCategoryPrices]=useState({});
const [venueCategories,setVenueCategories]=useState({});

// State for capacity modal
const [showCapacityModal,setShowCapacityModal]=useState(false);
const [selectedCapacityElement,setSelectedCapacityElement]=useState(null);
const [capacityToSelect,setCapacityToSelect]=useState(1);

/** * @typedef {Object} CartItem * @property {string} id - Уникальный идентификатор элемента корзины * @property {string} ticketId - РЕАЛЬНЫЙ ID билета из базы данных * @property {string} elementId - Идентификатор связанного элемента (места или зоны) * @property {string} label - Отображаемое название * @property {number} quantity - Количество мест * @property {number} unitPrice - Цена за одно место * @property {number} totalPrice - Общая цена (unitPrice * quantity) * @property {string} [categoryId] - ID категории для определения цены * @property {string} [type] - Тип элемента (seat,section,polygon) * @property {string[]} [ticketIds] - Массив ID всех билетов для групповых элементов */ 

// КРИТИЧНО ИСПРАВЛЕННАЯ функция-фабрика для создания элементов корзины
const createCartItem=(seat,unitPrice,availableTickets=[])=> {
// Определяем базовые значения
const quantity=seat.quantity || 1;
const actualUnitPrice=unitPrice !==undefined ? unitPrice : (seat.price / quantity);

// КРИТИЧНО: Используем реальные ticket IDs из доступных билетов
let realTicketIds=[];
if (availableTickets && availableTickets.length > 0) {
// Берем нужное количество ticket IDs из доступных билетов
realTicketIds=availableTickets.slice(0,quantity).map(ticket=> ticket.id);
} else if (seat.ticketId) {
realTicketIds=[seat.ticketId];
} else {
realTicketIds=[seat.id];
} 

console.log('🔧 Creating cart item:',{
seatId: seat.id,
quantity: quantity,
availableTicketsCount: availableTickets.length,
selectedTicketIds: realTicketIds,
unitPrice: actualUnitPrice
});

return {
id: `${seat.id}-${Date.now()}-${Math.random()}`,// УНИКАЛЬНЫЙ UI ID для управления в корзине
ticketId: realTicketIds[0],// Основной ticket ID для совместимости
ticketIds: realTicketIds,// НОВОЕ: Массив всех УНИКАЛЬНЫХ ticket IDs
elementId: seat.elementId || seat.id,
seatId: seat.id, // КРИТИЧНО ДОБАВЛЕНО: Оригинальный ID кресла для корректного сравнения
label: seat.number || seat.label || `Место ${seat.id.substring(0,4)}`,
quantity: quantity,
unitPrice: actualUnitPrice,
totalPrice: actualUnitPrice * quantity,

// Дополнительные данные для совместимости с существующим кодом
categoryId: seat.categoryId,
type: seat.type || 'seat',

// Для совместимости с существующим кодом
number: seat.number || seat.label || `Место ${seat.id.substring(0,4)}`,
price: actualUnitPrice * quantity,
// ДОБАВЛЯЕМ поля для отображения в корзине
section: seat.section ?? seat.zoneName ?? seat.label,
row: seat.row || 1
};
};

// Load event and venue data
useEffect(()=> {
const loadEventAndVenue=async ()=> {
try {
setLoading(true);
setError(null);

// Load event data
const eventData=await fetchEventById(id);
if (!eventData) {
setError("Событие не найдено");
return;
} 
setEvent(eventData);

// Extract prices by category for quick lookup
const prices={};
if (eventData.prices && eventData.prices.length > 0) {
eventData.prices.forEach(price=> {
if (price.category_id) {
prices[price.category_id]=price.price;
} 
// ДОБАВЛЯЕМ: Также индексируем по имени категории если есть
if (price.category && price.category.name) {
prices[price.category.name]=price.price;
}
});
} 
setCategoryPrices(prices);

if (eventData.venue_id) {
// Load venue data
const venueData=await fetchVenueById(eventData.venue_id);
if (!venueData) {
setError("Место проведения не найдено");
return;
} 
setVenue(venueData);

// Parse venue categories for display
if (venueData.geometry_data) {
try {
const geometryData=typeof venueData.geometry_data==='string' ? JSON.parse(venueData.geometry_data) : venueData.geometry_data;
setVenueCategories(geometryData.categories || {});
} catch (e) {
console.error('Error parsing venue geometry data:',e);
}
} 

// Load tickets for this event
try {
const ticketsData=await getEventTickets(id);
setTickets(ticketsData || []);

// Get ticket statistics
const stats=await getTicketsStatistics(id);
setTicketStats(stats);

console.log('Loaded tickets:',ticketsData?.length || 0);
console.log('Ticket stats:',stats);
} catch (ticketError) {
console.error('Error loading tickets:',ticketError);
setTickets([]);
setTicketStats({total: 0,available: 0,held: 0,sold: 0});
}
} else {
setError("Для этого события не выбрано место проведения");
}
} catch (err) {
console.error('Error loading event and venue:',err);
setError('Не удалось загрузить данные о событии и месте проведения');
} finally {
setLoading(false);
}
};

loadEventAndVenue();
},[id]);

// КРИТИЧНО ИСПРАВЛЕННАЯ функция поиска соответствующих билетов
const findCorrespondingTickets=(seat)=> {
console.log('🔍 ПОИСК БИЛЕТОВ для места/зоны:',seat);
console.log('🔍 Доступные билеты:',tickets.length);

// Фильтруем только свободные билеты
const freeTickets=tickets.filter(t=> t.status==='free' || t.status==='available');
console.log('🔍 Свободные билеты:',freeTickets.length);

if (seat.type==='seat') {
// Стратегия для отдельных мест - возвращаем один билет
let ticket=freeTickets.find(t=> t.seat_id===seat.id );

if (ticket) {
console.log('✅ Найден билет по seat_id:',ticket);
return [ticket];
} 

// Поиск по координатам для мест
const tolerance=5;
ticket=freeTickets.find(t=> {
if (!t.seat || !t.seat.x || !t.seat.y) return false;
const deltaX=Math.abs(t.seat.x - seat.x);
const deltaY=Math.abs(t.seat.y - seat.y);
return deltaX <=tolerance && deltaY <=tolerance;
});

if (ticket) {
console.log('✅ Найден билет по координатам места:',ticket);
return [ticket];
} 

// Поиск по категории
if (seat.categoryId) {
ticket=freeTickets.find(t=> {
if (!t.seat) return false;
const ticketCategory=t.seat.category;
return ticketCategory && (ticketCategory.name===seat.categoryId || ticketCategory.id===seat.categoryId);
});

if (ticket) {
console.log('✅ Найден билет по категории места:',ticket);
return [ticket];
}
} 

// Последняя попытка - любой свободный билет для места
ticket=freeTickets.find(t=> t.seat_id);
if (ticket) {
console.log('⚠️ Найден любой свободный билет для места (last resort):',ticket);
return [ticket];
}
} else if (seat.type==='section' || seat.type==='polygon') {
console.log('🔍 ПОИСК БИЛЕТОВ ДЛЯ ЗОНЫ:',{
seatId: seat.id,
elementId: seat.elementId,
categoryId: seat.categoryId,
type: seat.type,
quantity: seat.quantity
});

const quantity=seat.quantity || 1;

// 1. Поиск по точному совпадению zone_id с elementId
let zoneTickets=freeTickets.filter(t=> t.zone_id===seat.elementId );

if (zoneTickets.length >=quantity) {
const selectedTickets=zoneTickets.slice(0,quantity);
console.log(`✅ Найдено ${selectedTickets.length} билетов зоны по elementId:`,selectedTickets);
return selectedTickets;
} 

// 2. Поиск зоны по категории
if (seat.categoryId) {
console.log('🔍 Поиск зоны по категории:',seat.categoryId);
zoneTickets=freeTickets.filter(t=> {
if (!t.zone_id) return false;
const zoneCategory=t.zone?.category;
return zoneCategory && (zoneCategory.name===seat.categoryId || zoneCategory.id===seat.categoryId);
});

if (zoneTickets.length >=quantity) {
const selectedTickets=zoneTickets.slice(0,quantity);
console.log(`✅ Найдено ${selectedTickets.length} билетов зоны по категории:`,selectedTickets);
return selectedTickets;
}
} 

// 3. Поиск любых билетов зоны (fallback)
zoneTickets=freeTickets.filter(t=> t.zone_id);
if (zoneTickets.length >=quantity) {
const selectedTickets=zoneTickets.slice(0,quantity);
console.log(`⚠️ Найдено ${selectedTickets.length} билетов зоны (fallback):`,selectedTickets);
return selectedTickets;
}
} 

console.log('❌ Билеты не найдены для места/зоны:',seat);
return [];
};

// КРИТИЧНО ИСПРАВЛЕННАЯ функция обработки выбора мест
const handleSeatToggle=async (seat)=> {
console.log('🎯 ОТЛАДКА handleSeatToggle: Processing seat:', seat);
console.log('🎯 ОТЛАДКА handleSeatToggle: Current selectedSeats:', selectedSeats);

// ИСПРАВЛЕНО: Проверяем по ОРИГИНАЛЬНОМУ ID кресла, а не по elementId
const existingIndex = selectedSeats.findIndex(s => s.seatId === seat.id);
console.log('🎯 ОТЛАДКА handleSeatToggle: Found existing index:', existingIndex);

if (existingIndex >= 0) {
// Remove the seat
console.log('🎯 ОТЛАДКА handleSeatToggle: Removing seat from selection');
setSelectedSeats(selectedSeats.filter((_, index) => index !== existingIndex));
} else {
// Add the seat with the price from event prices
try {
console.log('🎯 ОТЛАДКА handleSeatToggle: Adding seat to selection');
const seatPrice=await getSeatPrice(seat);
console.log(`Got price for seat ${seat.id}: ${seatPrice}`);

// КРИТИЧНО: Найти соответствующие билеты в базе данных
const correspondingTickets=findCorrespondingTickets(seat);
if (!correspondingTickets || correspondingTickets.length===0) {
console.error('❌ No corresponding tickets found for seat:',seat);
alert('Не удалось найти доступные билеты для выбранного места. Возможно,все билеты уже забронированы.');
return;
} 

const requiredQuantity=seat.quantity || 1;
if (correspondingTickets.length < requiredQuantity) {
console.error(`❌ Not enough tickets found. Required: ${requiredQuantity},Found: ${correspondingTickets.length}`);
alert(`Недостаточно доступных билетов. Требуется: ${requiredQuantity},найдено: ${correspondingTickets.length}`);
return;
} 

console.log(`✅ Found ${correspondingTickets.length} corresponding tickets:`,correspondingTickets);

// КРИТИЧНО: Создаем элемент корзины с РЕАЛЬНЫМИ билетами
const cartItem=createCartItem(
{...seat},
seatPrice,
correspondingTickets // Передаем РЕАЛЬНЫЕ билеты
);

console.log('🎯 ОТЛАДКА handleSeatToggle: Created cart item:', cartItem);
setSelectedSeats([...selectedSeats,cartItem]);
} catch (error) {
console.error('Error getting seat price:',error);
alert('Не удалось получить цену для выбранного места. Попробуйте еще раз.');
}
}
};

// ПОЛНОСТЬЮ ПЕРЕПИСАННАЯ функция получения цены места с отладкой
const getSeatPrice=async (seat)=> {
try {
console.log("🔍 ОТЛАДКА: Getting price for seat/element:",seat);
console.log("🔍 ОТЛАДКА: Available category prices:",categoryPrices);
console.log("🔍 ОТЛАДКА: Event prices:",event.prices);

// 1. ПРИОРИТЕТ 1: Прямая проверка categoryId элемента
if (seat.categoryId) {
console.log(`🔍 ОТЛАДКА: Seat has categoryId: ${seat.categoryId}`);

// Проверяем кеш по ID категории
if (categoryPrices[seat.categoryId]) {
console.log(`✅ НАЙДЕНО: Using cached price for category ID ${seat.categoryId}:`,categoryPrices[seat.categoryId]);
return categoryPrices[seat.categoryId];
} 

// Ищем в event.prices по category_id
const eventPriceById=event.prices?.find(p=> p.category_id===seat.categoryId);
if (eventPriceById) {
console.log(`✅ НАЙДЕНО: Found event price by category_id ${seat.categoryId}:`,eventPriceById.price);
// Обновляем кеш
setCategoryPrices(prev=> ({...prev,[seat.categoryId]: eventPriceById.price}));
return eventPriceById.price;
} 

// Ищем в event.prices по имени категории
const eventPriceByName=event.prices?.find(p=> p.category?.name===seat.categoryId);
if (eventPriceByName) {
console.log(`✅ НАЙДЕНО: Found event price by category name ${seat.categoryId}:`,eventPriceByName.price);
// Обновляем кеш
setCategoryPrices(prev=> ({...prev,[seat.categoryId]: eventPriceByName.price}));
return eventPriceByName.price;
} 

// Пытаемся получить цену из API
try {
const priceData=await getTicketPrice(event.id,seat.categoryId);
if (priceData && priceData.price) {
console.log(`✅ НАЙДЕНО: Got price for ${seat.categoryId} from API:`,priceData.price);
// Обновляем кеш
setCategoryPrices(prev=> ({...prev,[seat.categoryId]: priceData.price}));
return priceData.price;
}
} catch (e) {
console.error("❌ ОШИБКА: Error fetching price from API:",e);
} 

console.log(`⚠️ НЕ НАЙДЕНО: No price found for category ${seat.categoryId}`);
} 

// 2. ПРИОРИТЕТ 2: Поиск через соответствующий билет
const relevantTickets=findCorrespondingTickets(seat);
if (relevantTickets && relevantTickets.length > 0) {
const relevantTicket=relevantTickets[0];
console.log("🔍 ОТЛАДКА: Found ticket for price lookup:",relevantTicket);

// Получаем категорию из билета
const category=relevantTicket.zone?.category || relevantTicket.seat?.category;
if (category && category.id) {
// Проверяем кеш
if (categoryPrices[category.id]) {
console.log(`✅ НАЙДЕНО: Using cached price for ticket category ${category.id}:`,categoryPrices[category.id]);
return categoryPrices[category.id];
} 

// Получаем цену из API
const priceData=await getTicketPrice(event.id,category.id);
if (priceData && priceData.price) {
console.log(`✅ НАЙДЕНО: Got price for ticket category ${category.id} from API:`,priceData.price);
setCategoryPrices(prev=> ({...prev,[category.id]: priceData.price}));
return priceData.price;
}
}
} 

// 3. ПРИОРИТЕТ 3: Последняя попытка - НЕ ИСПОЛЬЗУЕМ минимальную цену как fallback
console.log("❌ КРИТИЧЕСКАЯ ОШИБКА: No price found for seat with categoryId:",seat.categoryId);
console.log("❌ Available prices in event:",event.prices);
console.log("❌ Available cached prices:",categoryPrices);

// ВМЕСТО возврата минимальной цены,возвращаем ошибку или 0
// Это поможет выявить проблему
throw new Error(`No price found for category: ${seat.categoryId}`);
} catch (error) {
console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Error getting seat price:',error);
// Возвращаем 0 вместо минимальной цены,чтобы было видно что что-то не так
return 0;
}
};

const handleRemoveSeat=(seatId)=> {
setSelectedSeats(selectedSeats.filter(seat=> seat.id !==seatId));
};

const handleProceedToCheckout=()=> {
if (selectedSeats.length > 0) {
// КРИТИЧНО: Передаем правильные данные с ticket IDs
const seatsForCheckout=selectedSeats.map(seat=> ({
id: seat.ticketId,// Используем основной ID билета для совместимости
ticketId: seat.ticketId,// Дублируем для ясности
ticketIds: seat.ticketIds,// НОВОЕ: Массив всех ticket IDs
elementId: seat.elementId,
number: seat.label,
label: seat.label,
quantity: seat.quantity,
price: seat.totalPrice,
unitPrice: seat.unitPrice,
categoryId: seat.categoryId,
type: seat.type,
 section: seat.section || seat.zoneName,
row_number: seat.row,
seat_number: seat.number
}));

console.log('🚀 Proceeding to checkout with seats:',seatsForCheckout);

// Store selected seats in sessionStorage to access them in checkout
sessionStorage.setItem('selectedSeats',JSON.stringify(seatsForCheckout));
  const eventImage = event.image || null;
  const eventNote = event.note || '';
  if (!event.image) console.warn('Missing event.image for event', event.id);
  if (!event.note) console.warn('Missing event.note for event', event.id);
  sessionStorage.setItem('eventDetails',JSON.stringify({
  id: event.id,
  title: event.title,
  date: event.event_date,
  location: event.location,
  venue: venue?.name,
  note: eventNote,
  image: eventImage
}));

navigate('/checkout');
}
};

// ИСПРАВЛЕННАЯ функция получения информации о вместимости элемента
const getElementCapacityInfo=(element)=> {
const totalCapacity=element.capacity || 1;

// Count how many seats from this element are already selected
const selectedFromElement=selectedSeats
.filter(seat=> seat.elementId===element.id)
.reduce((total,seat)=> total + (seat.quantity || 1),0);

// ИСПРАВЛЕНО: Подсчет зарезервированных/проданных мест для этого элемента
// Используем правильные поля zone_id/seat_id и статусы
const reservedFromElement=tickets.filter(ticket=> {
if (element.type==='seat') {
// Для отдельных мест ищем по seat_id
return ticket.seat_id===element.id && ticket.status==='held';
} else {
// Для зон ищем по zone_id
return ticket.zone_id===element.id && ticket.status==='held';
}
}).length;

const purchasedFromElement=tickets.filter(ticket=> {
if (element.type==='seat') {
// Для отдельных мест ищем по seat_id
return ticket.seat_id===element.id && ticket.status==='sold';
} else {
// Для зон ищем по zone_id
return ticket.zone_id===element.id && ticket.status==='sold';
}
}).length;

const unavailable=reservedFromElement + purchasedFromElement;
const available=Math.max(0,totalCapacity - unavailable - selectedFromElement);

console.log(`📊 Capacity info for element ${element.id}:`,{
totalCapacity,
selectedFromElement,
reservedFromElement,
purchasedFromElement,
unavailable,
available
});

return {
total: totalCapacity,
available,
selected: selectedFromElement,
unavailable
};
};

// ИСПРАВЛЕННАЯ функция обработки модального окна выбора количества мест
const handleCapacityModalConfirm=()=> {
if (selectedCapacityElement && capacityToSelect > 0) {
// Получаем цену для элемента
getSeatPrice(selectedCapacityElement).then(unitPrice=> {
console.log(`Got unit price for capacity selection: ${unitPrice}`);

// Найти доступные билеты для этой зоны
const availableTicketsForZone=tickets.filter(t=> 
t.zone_id===selectedCapacityElement.id && 
(t.status==='free' || t.status==='available')
);

if (availableTicketsForZone.length < capacityToSelect) {
alert('Недостаточно доступных билетов для выбранного количества мест');
return;
} 

// Берем первые N билетов для резервирования
const ticketsToReserve=availableTicketsForZone.slice(0,capacityToSelect);

// ИСПОЛЬЗУЕМ ФАБРИКУ для создания элемента корзины
const cartItem=createCartItem({
id: `${selectedCapacityElement.id}-${Date.now()}`,
elementId: selectedCapacityElement.id,
number: `${selectedCapacityElement.label || 'Zone'} (${capacityToSelect} мест)`,
label: `${selectedCapacityElement.label || 'Zone'} (${capacityToSelect} мест)`,
zoneName: selectedCapacityElement.label,
categoryId: selectedCapacityElement.categoryId,
quantity: capacityToSelect,
type: selectedCapacityElement.type
},unitPrice,ticketsToReserve);// Передаем РЕАЛЬНЫЕ билеты

// Добавляем в выбранные места
setSelectedSeats(prev=> [...prev,cartItem]);

// Закрываем модальное окно
setShowCapacityModal(false);
setSelectedCapacityElement(null);
setCapacityToSelect(1);
}).catch(error=> {
console.error('Error getting price for capacity selection:',error);
// Показываем ошибку пользователю
alert('Не удалось получить цену для выбранной зоны. Попробуйте еще раз.');
setShowCapacityModal(false);
setSelectedCapacityElement(null);
setCapacityToSelect(1);
});
} else {
setShowCapacityModal(false);
setSelectedCapacityElement(null);
setCapacityToSelect(1);
}
};

// Format date for display
const formatDate=(date)=> {
if (!date) return '';
try {
const d=new Date(date);
const day=d.getDate();
const month=new Intl.DateTimeFormat('ru',{month: 'short'}).format(d);
const weekday=new Intl.DateTimeFormat('ru',{weekday: 'short'}).format(d);
const year=d.getFullYear();
return `${day} ${month} • ${weekday} • 20:00 • ${year}`;
} catch (e) {
return date;
}
};

// Format price with proper decimal places
const formatPrice=(price)=> {
return price ? Number(price).toFixed(2) : '0.00';
};

// ИСПРАВЛЕННАЯ функция подсчета общего количества билетов
const getTotalTicketCount=()=> {
return selectedSeats.reduce((total,seat)=> {
return total + seat.quantity;
},0);
};

// ИСПРАВЛЕННАЯ функция подсчета общей суммы
const calculateSubtotal=()=> {
return selectedSeats.reduce((sum,seat)=> sum + seat.totalPrice,0);
};

if (loading) {
return (
<div className="container mx-auto max-w-[960px] px-4 py-16 flex justify-center">
<div className="animate-pulse flex flex-col w-full">
<div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
<div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6"></div>
<div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
<div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-6"></div>
</div>
</div>
);
} 

if (error || !event) {
return (
<div className="container mx-auto max-w-[960px] px-4 py-16 text-center">
<h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
Событие не найдено
</h1>
<p className="mb-6 text-zinc-600 dark:text-zinc-400">
{error || "Запрошенное событие не существует или было удалено."}
</p>
<button 
onClick={()=> navigate('/events')}
className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
>
Просмотреть все события
</button>
</div>
);
} 

if (!venue) {
return (
<div className="container mx-auto max-w-[960px] px-4 py-16 text-center">
<h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
Место проведения не найдено
</h1>
<p className="mb-6 text-zinc-600 dark:text-zinc-400">
Для этого события не выбрано место проведения или оно было удалено.
</p>
<button 
onClick={()=> navigate(`/event/${id}`)}
className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
>
Вернуться к событию
</button>
</div>
);
} 

// Get held and sold seats from tickets (using correct status names)
const heldSeats=tickets.filter(ticket=> ticket.status==='held');
const soldSeats=tickets.filter(ticket=> ticket.status==='sold');

// Функция для получения цен категорий для отображения
const getCategoryPricesForDisplay=()=> {
const categoryPricesDisplay=[];

// Проходим по категориям места проведения
Object.entries(venueCategories).forEach(([categoryKey,categoryData])=> {
// Ищем соответствующую цену в ценах события
const eventPrice=event.prices?.find(p=> {
// Пытаемся найти соответствие по ID категории
return p.category && p.category.name===categoryKey;
});

if (eventPrice || categoryPrices[categoryKey]) {
categoryPricesDisplay.push({
id: categoryKey,
name: categoryData.name || categoryKey,
color: categoryData.color || '#3B82F6',
price: eventPrice?.price || categoryPrices[categoryKey] || 0
});
}
});

return categoryPricesDisplay;
};

return (
<div className="container mx-auto max-w-[960px] px-4 py-8">
{/* Event header */}
<div className="flex flex-row w-full max-w-100vw min-w-0 mb-6">
{/* Back arrow */}
<div className="flex items-center justify-center h-full">
<a 
onClick={()=> navigate(-1)} 
className="cursor-pointer flex items-center h-full"
>
<SafeIcon icon={FiArrowLeft} className="text-zinc-400 h-5 w-5" />
</a>
</div>

{/* Text block + badges */}
<div className="flex flex-col justify-center w-full ml-4">
<span className="text-yellow-500 text-sm font-bold leading-tight break-words mb-1">
{event.title}
</span>
<span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium leading-tight mb-1 break-words">
{formatDate(event.event_date)}
</span>
<span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium leading-tight mb-2 break-words">
{event.location}
</span>
{venue && (
<span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-tight mb-2 break-words">
Место: {venue.name}
</span>
)}
{ticketStats.total > 0 && (
<span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-tight mb-2 break-words">
Доступно билетов: {ticketStats.available} из {ticketStats.total}
</span>
)}

{/* НОВЫЙ БЛОК: Отображение цен категорий */}
{getCategoryPricesForDisplay().length > 0 && (
<div className="flex flex-wrap gap-2 mt-2">
{getCategoryPricesForDisplay().map(category=> (
<div key={category.id} className="flex items-center px-2 py-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-full">
<div 
className="w-2 h-2 rounded-full mr-2" 
style={{backgroundColor: category.color}}
/>
<span className="text-xs text-zinc-600 dark:text-zinc-400 mr-1">
{category.name}:
</span>
<span className="text-xs font-medium text-zinc-900 dark:text-white">
€{formatPrice(category.price)}
</span>
</div>
))}
</div>
)}
</div>
</div>

{/* Venue info button */}
<div className="flex justify-between items-center mb-4">
<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
{venue ? `Схема зала - ${venue.name}` : 'Выбор мест'}
</h2>
<div className="flex items-center space-x-2">
<button 
onClick={()=> setShowInfo(!showInfo)}
className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
>
<SafeIcon icon={showInfo ? FiX : FiInfo} className="text-zinc-400" />
</button>
<button 
onClick={()=> setShowCart(!showCart)}
className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition relative"
>
<SafeIcon icon={FiShoppingCart} className="text-zinc-400" />
{selectedSeats.length > 0 && (
<span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
{getTotalTicketCount()}
</span>
)}
</button>
</div>
</div>

{showInfo && (
<motion.div
initial={{opacity: 0,height: 0}}
animate={{opacity: 1,height: 'auto'}}
exit={{opacity: 0,height: 0}}
className="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-lg mb-4"
>
<h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Информация о зале</h3>
<p className="text-zinc-600 dark:text-zinc-400 mb-2">
Выберите места на схеме зала. Доступные места отмечены цветом.
</p>
{venue && (
<div className="mt-3 pt-3 border-t border-zinc-600">
<p className="text-xs text-zinc-500 dark:text-zinc-400">
Схема мест создана для площадки: {venue.name}
</p>
</div>
)}
{ticketStats.total > 0 && (
<div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
<p>Всего билетов: {ticketStats.total}</p>
<p>Доступно: {ticketStats.available}</p>
<p>Забронировано: {ticketStats.held}</p>
<p>Продано: {ticketStats.sold}</p>
</div>
)}
</motion.div>
)}

<div className="flex flex-col lg:flex-row gap-6 mb-8">
{/* Seating Chart */}
<div className="flex-1">
<div className="overflow-auto">
<VenueSeatingChart 
venue={venue}
eventId={id}
reservedSeats={heldSeats}
purchasedSeats={soldSeats}
selectedSeats={selectedSeats}
onSeatSelect={handleSeatToggle}
/>
</div>
</div>

{/* Cart - visible on larger screens or when toggled on mobile */}
<AnimatePresence>
{(showCart || window.innerWidth >=1024) && (
<motion.div
initial={{opacity: 0,x: 20}}
animate={{opacity: 1,x: 0}}
exit={{opacity: 0,x: 20}}
className="lg:w-72 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg p-4 flex flex-col lg:h-[500px]"
>
<div className="flex justify-between items-center mb-4">
<h3 className="font-medium text-zinc-900 dark:text-white">Ваш выбор</h3>
<button 
onClick={()=> setShowCart(false)}
className="lg:hidden p-2 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full"
>
<SafeIcon icon={FiX} className="w-4 h-4" />
</button>
</div>

{selectedSeats.length > 0 ? (
<>
<div className="flex-1 overflow-auto mb-4">
{selectedSeats.map((seat)=> (
<div key={seat.id} className="flex justify-between items-center p-2 mb-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg">
<div className="flex-1">
<p className="text-sm font-medium text-zinc-900 dark:text-white">
{seat.label}
</p>
<p className="text-xs text-zinc-600 dark:text-zinc-400">
{/* Добавляем отображение информации о ряде, секторе и номере кресла */}
{seat.section && <span>Сектор: {seat.section}</span>}
{seat.row && <span>{seat.section ? ' • ' : ''}Ряд: {seat.row}</span>}
{seat.number && <span>{(seat.section || seat.row) ? ' • ' : ''}Место: {seat.number}</span>}
{!seat.section && !seat.row && !seat.number && seat.label}
<br />
{/* ИСПРАВЛЕННОЕ отображение цены БЕЗ ФОРМУЛ */}
{seat.quantity > 1 ? (
<>
{formatPrice(seat.unitPrice)} € x {seat.quantity}
<br />
<span className="text-green-600 font-medium">
Итого: {formatPrice(seat.totalPrice)} €
</span>
</>
) : (
`${formatPrice(seat.totalPrice)} €`
)}
{/* Отладочная информация */}
<br />
<span className="text-blue-500 text-xs">
Tickets: {seat.ticketIds?.length || 1}
</span>
</p>
</div>
<button 
onClick={()=> handleRemoveSeat(seat.id)}
className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"
>
<SafeIcon icon={FiTrash2} className="w-4 h-4" />
</button>
</div>
))}
</div>

<div className="border-t border-zinc-300 dark:border-zinc-700 pt-4">
<div className="flex justify-between mb-2">
<span className="text-zinc-600 dark:text-zinc-400">Билетов:</span>
<span className="font-medium text-zinc-900 dark:text-white">
{getTotalTicketCount()}
</span>
</div>
<div className="flex justify-between mb-4">
<span className="text-zinc-600 dark:text-zinc-400">Итого:</span>
<span className="font-bold text-lg text-zinc-900 dark:text-white">
{formatPrice(calculateSubtotal())} €
</span>
</div>
<button 
onClick={handleProceedToCheckout}
className="w-full px-4 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium"
>
Перейти к оформлению
</button>
</div>
</>
) : (
<div className="flex-1 flex flex-col items-center justify-center text-center">
<SafeIcon icon={FiShoppingCart} className="w-12 h-12 text-zinc-500 dark:text-zinc-400 mb-3" />
<p className="text-zinc-600 dark:text-zinc-400">
Выберите места на схеме зала
</p>
</div>
)}
</motion.div>
)}
</AnimatePresence>
</div>

{/* Mobile checkout button (fixed at bottom) */}
{selectedSeats.length > 0 && !showCart && (
<div className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-4 lg:hidden">
<div className="flex justify-between items-center mb-2">
<span className="text-white">
{getTotalTicketCount()} {getTotalTicketCount()===1 ? 'билет' : 'билетов'}
</span>
<span className="font-bold text-white">
{formatPrice(calculateSubtotal())} €
</span>
</div>
<div className="flex gap-2">
<button 
onClick={()=> setShowCart(true)}
className="flex-1 px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg"
>
Просмотр корзины
</button>
<button 
onClick={handleProceedToCheckout}
className="flex-1 px-4 py-2 bg-yellow-500 text-black rounded-lg"
>
К оформлению
</button>
</div>
</div>
)}

{/* Capacity Selection Modal - ИСПРАВЛЕННАЯ ВЕРСИЯ С ДИНАМИЧЕСКИМ СПИСКОМ */}
{showCapacityModal && selectedCapacityElement && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
<motion.div
initial={{opacity: 0,scale: 0.9}}
animate={{opacity: 1,scale: 1}}
className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4"
>
<h3 className="text-lg font-semibold text-white mb-4">
Select Seats - {selectedCapacityElement.label}
</h3>
<div className="mb-4">
<p className="text-gray-400 text-sm mb-2">
Available seats: {getElementCapacityInfo(selectedCapacityElement).available}
</p>
<label className="block text-sm font-medium text-gray-400 mb-2">
Number of seats to select:
</label>
{/* ИСПРАВЛЕННЫЙ SELECT с динамическим списком доступных мест */}
<select 
value={capacityToSelect}
onChange={(e)=> setCapacityToSelect(parseInt(e.target.value))}
className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
>
{/* КРИТИЧНО ИСПРАВЛЕНО: Генерируем опции на основе РЕАЛЬНОГО количества доступных мест */}
{(() => {
const availableCount = getElementCapacityInfo(selectedCapacityElement).available;
if (availableCount === 0) {
return <option value={0}>Нет доступных мест</option>;
}
return Array.from({length: availableCount}, (_, i) => i + 1).map(num => (
<option key={num} value={num}>{num}</option>
));
})()}
</select>
</div>
<div className="flex justify-end space-x-3">
<button 
onClick={()=> {
setShowCapacityModal(false);
setSelectedCapacityElement(null);
setCapacityToSelect(1);
}}
className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors"
>
Cancel
</button>
<button 
onClick={handleCapacityModalConfirm}
disabled={getElementCapacityInfo(selectedCapacityElement).available === 0}
className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
Add to Selection
</button>
</div>
</motion.div>
</div>
)}
</div>
);
};

export default VenuePage;