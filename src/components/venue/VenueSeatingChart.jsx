import React,{useRef,useEffect,useState,useCallback} from 'react';
import {motion} from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const {FiPlus,FiMinus,FiMove}=FiIcons;

const VenueSeatingChart=({
venue,
eventId,
reservedSeats=[],
purchasedSeats=[],
selectedSeats=[],
onSeatSelect,
readonly=false
})=> {
const canvasRef=useRef(null);
const containerRef=useRef(null);
const [scale,setScale]=useState(1);
const [pan,setPan]=useState({x: 0,y: 0});
const [isDragging,setIsDragging]=useState(false);
const [dragStart,setDragStart]=useState({x: 0,y: 0});
const [elements,setElements]=useState([]);
const [categories,setCategories]=useState({});
const [bounds,setBounds]=useState({minX: 0,minY: 0,maxX: 800,maxY: 600});
const [isCanvasActive,setIsCanvasActive]=useState(false);
const [showGrid,setShowGrid]=useState(true);
const [lastTouchDistance,setLastTouchDistance]=useState(null);
const [lastPinchCenter,setLastPinchCenter]=useState(null);

// State for capacity modal
const [showCapacityModal,setShowCapacityModal]=useState(false);
const [selectedCapacityElement,setSelectedCapacityElement]=useState(null);
const [capacityToSelect,setCapacityToSelect]=useState(1);

// НОВОЕ: состояние для билетов и зон
const [tickets,setTickets]=useState([]);
const [venueZones,setVenueZones]=useState([]);

// НОВАЯ функция для загрузки билетов
const loadTickets=useCallback(async ()=> {
if (!eventId) return;

try {
// Импортируем функцию загрузки билетов
const {getEventTickets}=await import('../../services/ticketService');
const ticketsData=await getEventTickets(eventId);
setTickets(ticketsData || []);
console.log('🎫 Loaded tickets for venue chart:',ticketsData?.length || 0);

// НОВОЕ: Анализируем структуру билетов для отладки
if (ticketsData && ticketsData.length > 0) {
console.log('🔍 АНАЛИЗ БИЛЕТОВ:');
console.log('📊 Общая статистика билетов:',{
total: ticketsData.length,
withZoneId: ticketsData.filter(t=> t.zone_id).length,
withSeatId: ticketsData.filter(t=> t.seat_id).length,
freeTickets: ticketsData.filter(t=> t.status==='free').length,
soldTickets: ticketsData.filter(t=> t.status==='sold').length,
heldTickets: ticketsData.filter(t=> t.status==='held').length
});

// Показываем уникальные zone_id
const uniqueZoneIds=[...new Set(ticketsData.filter(t=> t.zone_id).map(t=> t.zone_id))];
console.log('🏟️ Уникальные zone_id в билетах:',uniqueZoneIds);

// Показываем примеры билетов
console.log('🎫 Пример билета с zone_id:',ticketsData.find(t=> t.zone_id));
console.log('🎫 Пример билета с seat_id:',ticketsData.find(t=> t.seat_id));
}
} catch (error) {
console.error('Error loading tickets for venue chart:',error);
setTickets([]);
}
},[eventId]);

// НОВАЯ функция для загрузки зон места проведения
const loadVenueZones=useCallback(async ()=> {
if (!venue?.id) return;

try {
// Загружаем зоны из базы данных
const {default: supabase}=await import('../../lib/supabase');
const {data: zonesData,error}=await supabase
.from('zones')
.select('*')
.eq('venue_id',venue.id);

if (error) throw error;

setVenueZones(zonesData || []);
console.log('🏟️ Loaded venue zones:',zonesData?.length || 0);

if (zonesData && zonesData.length > 0) {
console.log('🔍 АНАЛИЗ ЗОН МЕСТА ПРОВЕДЕНИЯ:');
zonesData.forEach(zone=> {
console.log(`📍 Зона "${zone.name}" (ID: ${zone.id}):`,{
capacity: zone.capacity,
category_id: zone.category_id,
ui_shape: zone.ui_shape ? JSON.parse(zone.ui_shape) : null
});
});
}
} catch (error) {
console.error('Error loading venue zones:',error);
setVenueZones([]);
}
},[venue?.id]);

// Загружаем билеты при изменении eventId
useEffect(()=> {
loadTickets();
},[loadTickets]);

// Загружаем зоны при изменении venue
useEffect(()=> {
loadVenueZones();
},[loadVenueZones]);

// КРИТИЧЕСКИ ИСПРАВЛЕННАЯ функция сопоставления UI элемента с зоной БД
const findMatchingZoneForElement=useCallback((element)=> {
if (!venueZones || venueZones.length===0) {
console.log('⚠️ Нет загруженных зон для сопоставления');
return null;
}

console.log('🔍 ПОИСК СООТВЕТСТВУЮЩЕЙ ЗОНЫ для элемента:',{
elementId: element.id,
elementLabel: element.label,
elementType: element.type,
elementCategoryId: element.categoryId
});

// Стратегия 1: Поиск по точному совпадению ID (если элемент создавался из зоны БД)
let matchingZone=venueZones.find(zone=> zone.id===element.id);
if (matchingZone) {
console.log('✅ НАЙДЕНО: Точное совпадение ID зоны:',matchingZone);
return matchingZone;
}

// Стратегия 2: Поиск по названию/метке
if (element.label) {
matchingZone=venueZones.find(zone=> 
zone.name===element.label || 
zone.name.toLowerCase()===element.label.toLowerCase()
);
if (matchingZone) {
console.log('✅ НАЙДЕНО: Совпадение по названию зоны:',matchingZone);
return matchingZone;
}
}

// Стратегия 3: Поиск по ui_shape данным (координаты,размер)
if (element.x !==undefined && element.y !==undefined) {
matchingZone=venueZones.find(zone=> {
if (!zone.ui_shape) return false;

try {
const uiShape=typeof zone.ui_shape==='string' 
? JSON.parse(zone.ui_shape) 
: zone.ui_shape;

// Проверяем совпадение координат с допуском
const tolerance=10;
const xMatch=Math.abs((uiShape.x || 0) - element.x) <=tolerance;
const yMatch=Math.abs((uiShape.y || 0) - element.y) <=tolerance;

if (xMatch && yMatch) {
console.log('✅ НАЙДЕНО: Совпадение по координатам зоны:',{
zone: matchingZone,
uiShape: uiShape,
elementCoords: {x: element.x,y: element.y}
});
return true;
}
} catch (e) {
console.warn('Ошибка парсинга ui_shape для зоны:',zone.id,e);
}
return false;
});

if (matchingZone) {
return matchingZone;
}
}

// Стратегия 4: Поиск по категории (если есть только одна зона с такой категорией)
if (element.categoryId) {
const zonesByCategory=venueZones.filter(zone=> {
// Здесь нужно проверить связь с seat_categories через category_id
return zone.category_id===element.categoryId;
});

if (zonesByCategory.length===1) {
matchingZone=zonesByCategory[0];
console.log('✅ НАЙДЕНО: Единственная зона с категорией:',matchingZone);
return matchingZone;
} else if (zonesByCategory.length > 1) {
console.log('⚠️ Найдено несколько зон с категорией:',element.categoryId,zonesByCategory);
}
}

// Стратегия 5: Если есть только одна зона в месте проведения (fallback)
if (venueZones.length===1) {
matchingZone=venueZones[0];
console.log('⚠️ FALLBACK: Используем единственную доступную зону:',matchingZone);
return matchingZone;
}

console.log('❌ НЕ НАЙДЕНО: Соответствующая зона для элемента не найдена');
console.log('📋 Доступные зоны:',venueZones.map(z=> ({
id: z.id,
name: z.name,
category_id: z.category_id
})));

return null;
},[venueZones]);

// Prevent page scroll when canvas is active
useEffect(()=> {
const preventScroll=(e)=> {
if (isCanvasActive) {
e.preventDefault();
e.stopPropagation();
return false;
}
};

const handleWheel=(e)=> {
if (isCanvasActive) {
e.preventDefault();
e.stopPropagation();
return false;
}
};

const handleTouchMove=(e)=> {
if (isCanvasActive) {
e.preventDefault();
e.stopPropagation();
return false;
}
};

if (isCanvasActive) {
document.body.style.overflow='hidden';
document.addEventListener('wheel',handleWheel,{passive: false});
document.addEventListener('touchmove',handleTouchMove,{passive: false});
document.addEventListener('scroll',preventScroll,{passive: false});
} else {
document.body.style.overflow='';
document.removeEventListener('wheel',handleWheel);
document.removeEventListener('touchmove',handleTouchMove);
document.removeEventListener('scroll',preventScroll);
}

return ()=> {
document.body.style.overflow='';
document.removeEventListener('wheel',handleWheel);
document.removeEventListener('touchmove',handleTouchMove);
document.removeEventListener('scroll',preventScroll);
};
},[isCanvasActive]);

// Load venue layout
useEffect(()=> {
if (venue?.geometry_data) {
try {
const geometryData=typeof venue.geometry_data==='string' 
? JSON.parse(venue.geometry_data) 
: venue.geometry_data;

setElements(geometryData.elements || []);
setCategories(geometryData.categories || {});

if (geometryData.showGrid !==undefined) {
setShowGrid(geometryData.showGrid);
}
} catch (error) {
console.error('Error parsing venue geometry data:',error);
setElements([]);
setCategories({});
}
} else {
setElements([]);
setCategories({});
}
},[venue]);

// Calculate bounding box of all elements
const calculateBounds=useCallback(()=> {
if (elements.length===0) return {minX: 0,minY: 0,maxX: 800,maxY: 600};

let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;

elements.forEach(element=> {
if (element.type==='seat') {
const size=element.size || 20;
minX=Math.min(minX,element.x);
minY=Math.min(minY,element.y);
maxX=Math.max(maxX,element.x + size);
maxY=Math.max(maxY,element.y + size);
} else if (element.type==='section' || element.type==='stage') {
const width=element.width || 100;
const height=element.height || 80;
minX=Math.min(minX,element.x);
minY=Math.min(minY,element.y);
maxX=Math.max(maxX,element.x + width);
maxY=Math.max(maxY,element.y + height);
} else if (element.type==='polygon' && element.points) {
element.points.forEach(point=> {
minX=Math.min(minX,point.x);
minY=Math.min(minY,point.y);
maxX=Math.max(maxX,point.x);
maxY=Math.max(maxY,point.y);
});
}
});

// Add some padding
const padding=50;
const newBounds={
minX: minX - padding,
minY: minY - padding,
maxX: maxX + padding,
maxY: maxY + padding
};

setBounds(newBounds);
return newBounds;
},[elements]);

// Auto-fit and center view on load
useEffect(()=> {
if (elements.length > 0) {
const newBounds=calculateBounds();
fitToView(newBounds);
}
},[elements]);

// Fit all elements to view
const fitToView=useCallback((customBounds=null)=> {
const canvas=canvasRef.current;
if (!canvas || elements.length===0) return;

const venBounds=customBounds || bounds;
const contentWidth=venBounds.maxX - venBounds.minX;
const contentHeight=venBounds.maxY - venBounds.minY;
const canvasWidth=canvas.width;
const canvasHeight=canvas.height;

// Calculate scale to fit content with some margin
const scaleX=(canvasWidth * 0.9) / contentWidth;
const scaleY=(canvasHeight * 0.9) / contentHeight;
const newScale=Math.min(scaleX,scaleY,2);// Max scale of 2

// Center the content
const centerX=(venBounds.minX + venBounds.maxX) / 2;
const centerY=(venBounds.minY + venBounds.maxY) / 2;
const newPanX=canvasWidth / 2 - centerX * newScale;
const newPanY=canvasHeight / 2 - centerY * newScale;

setScale(newScale);
setPan({x: newPanX,y: newPanY});
},[elements,bounds]);

// КРИТИЧНО ИСПРАВЛЕННАЯ функция getSeatStatus для корректного определения выбранных кресел
const getSeatStatus = useCallback((seatId) => {
// Проверяем проданные билеты
if (purchasedSeats.find(s => s.seat_id === seatId)) return 'purchased';
// Проверяем зарезервированные билеты
if (reservedSeats.find(s => s.seat_id === seatId)) return 'reserved';
// ИСПРАВЛЕНО: Проверяем выбранные кресла по правильному полю seatId
if (selectedSeats.find(s => s.seatId === seatId)) return 'selected';
return 'free';
}, [reservedSeats, purchasedSeats, selectedSeats]);

const getSeatColor=useCallback((seat,status)=> {
switch (status) {
case 'purchased': return '#6B7280';// Gray
case 'reserved': return '#F59E0B';// Amber
case 'selected': return '#10B981';// Green
case 'free':
default:
// Use category color if available
if (seat.categoryId && categories[seat.categoryId]) {
return categories[seat.categoryId].color;
}
return '#3B82F6';// Blue
}
},[categories]);

// КРИТИЧЕСКИ ИСПРАВЛЕННАЯ функция получения информации о вместимости элемента
const getElementCapacityInfo=useCallback((element)=> {
  if (!element || !tickets) {
    return {
      total: 0,
      free: 0,
      selected: 0,
      unavailable: 0
    };
  }

console.log('🔍 ОТЛАДКА getElementCapacityInfo для элемента:',{
elementId: element.id,
elementType: element.type,
elementLabel: element.label,
totalTickets: tickets.length
});

// Подсчет уже выбранных мест от этого элемента
const selectedFromElement=selectedSeats
  .filter(seat=> seat.elementId===element.id)
  .reduce((total,seat)=> total + (seat.quantity || 1),0);

let relevantTickets=[];
let matchingZone=null;

if (element.type==='seat') {
  // Для отдельных мест ищем билеты с seat_id равным element.id
  relevantTickets=tickets.filter(ticket=> ticket.seat_id===element.id);
} else if (element.type==='section' || element.type==='polygon') {
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем функцию сопоставления зоны
  matchingZone=findMatchingZoneForElement(element);

  if (matchingZone) {
    console.log('✅ НАЙДЕНА СООТВЕТСТВУЮЩАЯ ЗОНА:',{
      elementId: element.id,
      zoneId: matchingZone.id,
      zoneName: matchingZone.name,
      zoneCapacity: matchingZone.capacity
    });

    // Ищем билеты по найденной зоне
    relevantTickets=tickets.filter(ticket=> ticket.zone_id===matchingZone.id);
  } else {
    console.log('❌ НЕ НАЙДЕНА СООТВЕТСТВУЮЩАЯ ЗОНА для элемента:',element.id);

    // FALLBACK: Попытка поиска по оригинальному element.id
    relevantTickets=tickets.filter(ticket=> ticket.zone_id===element.id);
  }
}

if (relevantTickets.length===0) {
  if (matchingZone) {
    return {
      total: matchingZone.capacity,
      free: matchingZone.capacity,
      selected: selectedFromElement,
      unavailable: 0
    };
  }

  const capacity=element.capacity || 0;
  return {
    total: capacity,
    free: capacity,
    selected: selectedFromElement,
    unavailable: 0
  };
}

console.log('🔍 ОТЛАДКА relevantTickets:',{
  elementId: element.id,
  relevantTicketsCount: relevantTickets.length,
  ticketStatuses: relevantTickets.map(t=> t.status)
});

// Подсчитываем билеты по статусам
const freeTickets=relevantTickets.filter(t=> t.status==='free');
const heldTickets=relevantTickets.filter(t=> t.status==='held');
const soldTickets=relevantTickets.filter(t=> t.status==='sold');

const total=relevantTickets.length;
const unavailable=heldTickets.length + soldTickets.length;
const free=Math.max(0,freeTickets.length - selectedFromElement);

const result={
  total,
  free,
  selected: selectedFromElement,
  unavailable
};

console.log('🔍 ОТЛАДКА результат getElementCapacityInfo:',{
elementId: element.id,
result,
freeTicketsCount: freeTickets.length,
heldTicketsCount: heldTickets.length,
soldTicketsCount: soldTickets.length
});

return result;
},[selectedSeats,tickets,findMatchingZoneForElement]);

// Drawing functions
const drawGrid=useCallback((ctx,width,height)=> {
if (!showGrid) return;

ctx.strokeStyle='#18181b';// Changed grid color to #18181b
ctx.lineWidth=0.5;

const gridSize=20 * scale;
const offsetX=pan.x % gridSize;
const offsetY=pan.y % gridSize;

// Vertical lines
for (let x=offsetX;x < width;x +=gridSize) {
ctx.beginPath();
ctx.moveTo(x,0);
ctx.lineTo(x,height);
ctx.stroke();
}

// Horizontal lines
for (let y=offsetY;y < height;y +=gridSize) {
ctx.beginPath();
ctx.moveTo(0,y);
ctx.lineTo(width,y);
ctx.stroke();
}
},[scale,pan,showGrid]);

const drawStage=useCallback((ctx)=> {
// Find stage elements
const stages=elements.filter(el=> el.type==='stage');

stages.forEach(stage=> {
const x=stage.x * scale + pan.x;
const y=stage.y * scale + pan.y;
const width=(stage.width || 200) * scale;
const height=(stage.height || 40) * scale;

ctx.fillStyle=stage.color || '#6B7280';
ctx.fillRect(x,y,width,height);

ctx.fillStyle='#FFFFFF';
ctx.font=`${12 * scale}px Arial`;
ctx.textAlign='center';
ctx.fillText(stage.label || 'STAGE',x + width / 2,y + height / 2 + 4);
});
},[elements,scale,pan]);

const drawSeat=useCallback((ctx,seat)=> {
const status=getSeatStatus(seat.id);
const x=seat.x * scale + pan.x;
const y=seat.y * scale + pan.y;
const size=(seat.size || 20) * scale;
const color=getSeatColor(seat,status);

// Check if seat is bookable
const isBookable=seat.is_bookable !==false;

// Apply opacity if not bookable
if (!isBookable) {
ctx.globalAlpha=0.4;
}

// Seat background
ctx.fillStyle=color;
ctx.beginPath();
ctx.roundRect(x,y,size,size,4 * scale);
ctx.fill();

// Seat border for selected/reserved
if (status==='selected') {
ctx.strokeStyle='#059669';
ctx.lineWidth=2;
ctx.stroke();
} else if (status==='reserved') {
ctx.strokeStyle='#D97706';
ctx.lineWidth=2;
ctx.stroke();
}

// Seat number if scale is large enough
if (seat.number && scale > 0.5) {
ctx.fillStyle=status==='purchased' ? '#9CA3AF' : '#FFFFFF';
ctx.font=`${Math.min(10 * scale,size * 0.4)}px Arial`;
ctx.textAlign='center';
ctx.fillText(seat.number,x + size / 2,y + size / 2 + 3);
}

// Check mark for selected seats
if (status==='selected' && scale > 0.7) {
ctx.fillStyle='#FFFFFF';
ctx.font=`${size * 0.6}px Arial`;
ctx.fillText('✓',x + size / 2,y + size / 2 + 2);
}

// Reset opacity
ctx.globalAlpha=1.0;
},[scale,pan,getSeatStatus,getSeatColor]);

const drawSection=useCallback((ctx,section)=> {
const x=section.x * scale + pan.x;
const y=section.y * scale + pan.y;
const width=(section.width || 100) * scale;
const height=(section.height || 80) * scale;

// Get section color from category
let sectionColor='#3B82F6';
if (section.categoryId && categories[section.categoryId]) {
sectionColor=categories[section.categoryId].color;
}

// Check if section is bookable and get capacity info
const isBookable=section.is_bookable !==false;
const capacityInfo=getElementCapacityInfo(section);

// Determine visual state
let opacity=1;
let strokeStyle=sectionColor;
if (!isBookable) {
opacity=0.4;
} else if (capacityInfo.free===0) {
opacity=0.6;
strokeStyle='#6B7280';// Gray when full
}

ctx.globalAlpha=opacity;

// Section background
ctx.fillStyle=`${sectionColor}33`;// 20% opacity
ctx.fillRect(x,y,width,height);

// Section border
ctx.strokeStyle=strokeStyle;
ctx.lineWidth=2;
ctx.strokeRect(x,y,width,height);

// Section label
if (section.label && scale > 0.6) {
ctx.fillStyle='#9CA3AF';
ctx.font=`${12 * scale}px Arial`;
ctx.textAlign='center';
ctx.fillText(section.label,x + width / 2,y + height / 2);
}

// Capacity info - ИСПРАВЛЕНО: показываем реальные доступные места
if (scale > 0.5) {
const capacityText=`${capacityInfo.free}/${capacityInfo.total}`;
ctx.fillStyle='#9CA3AF';
ctx.font=`${10 * scale}px Arial`;
ctx.textAlign='center';
ctx.fillText(capacityText,x + width / 2,y + height / 2 + 18 * scale);
}

ctx.globalAlpha=1.0;
},[scale,pan,categories,getElementCapacityInfo]);

const drawPolygon=useCallback((ctx,polygon)=> {
if (!polygon.points || polygon.points.length < 3) return;

const points=polygon.points.map(point=> ({
x: point.x * scale + pan.x,
y: point.y * scale + pan.y
}));

// Get polygon color from category
let polygonColor='#3B82F6';
if (polygon.categoryId && categories[polygon.categoryId]) {
polygonColor=categories[polygon.categoryId].color;
}

// Check if polygon is bookable and get capacity info
const isBookable=polygon.is_bookable !==false;
const capacityInfo=getElementCapacityInfo(polygon);

// Determine visual state
let opacity=1;
let strokeStyle=polygonColor;
if (!isBookable) {
opacity=0.4;
} else if (capacityInfo.free===0) {
opacity=0.6;
strokeStyle='#6B7280';// Gray when full
}

ctx.globalAlpha=opacity;

// Draw polygon
ctx.beginPath();
ctx.moveTo(points[0].x,points[0].y);
for (let i=1;i < points.length;i++) {
ctx.lineTo(points[i].x,points[i].y);
}
ctx.closePath();

// Fill polygon with semi-transparent color
ctx.fillStyle=`${polygonColor}33`;// 20% opacity
ctx.fill();

// Stroke polygon
ctx.strokeStyle=strokeStyle;
ctx.lineWidth=2;
ctx.stroke();

// Draw label if exists
if (polygon.label && scale > 0.6) {
// Calculate center of polygon
const centerX=points.reduce((sum,p)=> sum + p.x,0) / points.length;
const centerY=points.reduce((sum,p)=> sum + p.y,0) / points.length;

ctx.fillStyle='#9CA3AF';
ctx.font=`bold ${14 * scale}px Arial`;
ctx.textAlign='center';
ctx.fillText(polygon.label,centerX,centerY);

// Capacity info - ИСПРАВЛЕНО: показываем реальные доступные места
if (scale > 0.5) {
const capacityText=`${capacityInfo.free}/${capacityInfo.total}`;
ctx.fillStyle='#9CA3AF';
ctx.font=`${10 * scale}px Arial`;
ctx.textAlign='center';
ctx.fillText(capacityText,centerX,centerY + 18 * scale);
}
}

ctx.globalAlpha=1.0;
},[scale,pan,categories,getElementCapacityInfo]);

const draw=useCallback(()=> {
const canvas=canvasRef.current;
if (!canvas) return;

const ctx=canvas.getContext('2d');
ctx.clearRect(0,0,canvas.width,canvas.height);

// Draw grid
drawGrid(ctx,canvas.width,canvas.height);

// Draw stage
drawStage(ctx);

// Draw sections first
elements.filter(el=> el.type==='section').forEach(section=> {
drawSection(ctx,section);
});

// Draw polygons
elements.filter(el=> el.type==='polygon').forEach(polygon=> {
drawPolygon(ctx,polygon);
});

// Draw seats on top
elements.filter(el=> el.type==='seat').forEach(seat=> {
drawSeat(ctx,seat);
});
},[
elements,
drawGrid,
drawStage,
drawSection,
drawPolygon,
drawSeat
]);

// Event handlers
const getMousePos=useCallback((e)=> {
const canvas=canvasRef.current;
if (!canvas) return {x: 0,y: 0};

const rect=canvas.getBoundingClientRect();
return {
x: (e.clientX - rect.left - pan.x) / scale,
y: (e.clientY - rect.top - pan.y) / scale
};
},[scale,pan]);

// Check if point is inside element
const isPointInElement=useCallback((point,element)=> {
if (element.type==='seat') {
const size=element.size || 20;
return (
point.x >=element.x && point.x <=element.x + size &&
point.y >=element.y && point.y <=element.y + size
);
} else if (element.type==='section' || element.type==='stage') {
const width=element.width || 100;
const height=element.height || 80;
return (
point.x >=element.x && point.x <=element.x + width &&
point.y >=element.y && point.y <=element.y + height
);
} else if (element.type==='polygon') {
return isPointInPolygon(point,element.points);
}
return false;
},[]);

// Check if point is in polygon using ray casting algorithm
const isPointInPolygon=(point,polygonPoints)=> {
if (!polygonPoints || polygonPoints.length < 3) return false;

let inside=false;
for (let i=0,j=polygonPoints.length - 1;i < polygonPoints.length;j=i++) {
const xi=polygonPoints[i].x;
const yi=polygonPoints[i].y;
const xj=polygonPoints[j].x;
const yj=polygonPoints[j].y;

const intersect=((yi > point.y) !==(yj > point.y)) &&
(point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
if (intersect) inside=!inside;
}

return inside;
};

// Handle capacity modal
const handleCapacityModalConfirm=()=> {
if (selectedCapacityElement && capacityToSelect > 0) {
// Get category ID from the element for pricing
const categoryId=selectedCapacityElement.categoryId;

// Create a single group element representing multiple seats
const groupSeat={
id: `${selectedCapacityElement.id}-${Date.now()}`,
elementId: selectedCapacityElement.id,
number: `${selectedCapacityElement.label || 'Zone'} (${capacityToSelect} seats)`,
categoryId: categoryId,
type: selectedCapacityElement.type,
quantity: capacityToSelect
};

// Add the group seat to selection
onSeatSelect?.(groupSeat);
}

// Close modal and reset state
setShowCapacityModal(false);
setSelectedCapacityElement(null);
setCapacityToSelect(1);
};

const handleMouseDown=useCallback((e)=> {
if (readonly) return;

const pos=getMousePos(e);

// Check if clicking on a seat
const clickedSeat=elements.find(element=> {
if (element.type !=='seat') return false;
return isPointInElement(pos,element);
});

if (clickedSeat) {
const status=getSeatStatus(clickedSeat.id);
if (status==='free' || status==='selected') {
onSeatSelect?.(clickedSeat);
}
return;
}

// Check if clicking on a capacity element (section or polygon)
const clickedCapacityElement=elements.find(element=> {
if (element.type !=='section' && element.type !=='polygon') return false;
if (element.is_bookable===false) return false;

// ИСПРАВЛЕНО: проверяем реальное количество доступных билетов
const capacityInfo=getElementCapacityInfo(element);
if (capacityInfo.free <=0) return false;

return isPointInElement(pos,element);
});

if (clickedCapacityElement) {
const capacityInfo=getElementCapacityInfo(clickedCapacityElement);
if (capacityInfo.free > 0) {
  setSelectedCapacityElement(clickedCapacityElement);
  setCapacityToSelect(Math.min(capacityInfo.free,1));
  setShowCapacityModal(true);
}
return;
}

// Start panning
setIsDragging(true);
setDragStart({x: e.clientX - pan.x,y: e.clientY - pan.y});
},[
readonly,
elements,
getMousePos,
getSeatStatus,
onSeatSelect,
pan,
isPointInElement,
getElementCapacityInfo
]);

const handleMouseMove=useCallback((e)=> {
if (isDragging) {
setPan({
x: e.clientX - dragStart.x,
y: e.clientY - dragStart.y
});
}
},[isDragging,dragStart]);

const handleMouseUp=useCallback(()=> {
setIsDragging(false);
},[]);

const handleWheel=useCallback((e)=> {
e.preventDefault();

// Get the mouse position before scaling
const canvas=canvasRef.current;
if (!canvas) return;

const rect=canvas.getBoundingClientRect();
const mouseX=e.clientX - rect.left;
const mouseY=e.clientY - rect.top;

// Calculate position in world space
const worldX=(mouseX - pan.x) / scale;
const worldY=(mouseY - pan.y) / scale;

// Calculate new scale
const delta=e.deltaY > 0 ? 0.9 : 1.1;
const newScale=Math.min(Math.max(scale * delta,0.2),3);

// Calculate new pan to keep the point under the mouse fixed
const newPanX=mouseX - worldX * newScale;
const newPanY=mouseY - worldY * newScale;

setScale(newScale);
setPan({x: newPanX,y: newPanY});
},[scale,pan]);

const zoomIn=useCallback(()=> {
// Get the center of the canvas
const canvas=canvasRef.current;
if (!canvas) return;

const centerX=canvas.width / 2;
const centerY=canvas.height / 2;

// Calculate position in world space
const worldX=(centerX - pan.x) / scale;
const worldY=(centerY - pan.y) / scale;

// Calculate new scale
const newScale=Math.min(scale * 1.2,3);

// Calculate new pan to keep the center point fixed
const newPanX=centerX - worldX * newScale;
const newPanY=centerY - worldY * newScale;

setScale(newScale);
setPan({x: newPanX,y: newPanY});
},[scale,pan]);

const zoomOut=useCallback(()=> {
// Get the center of the canvas
const canvas=canvasRef.current;
if (!canvas) return;

const centerX=canvas.width / 2;
const centerY=canvas.height / 2;

// Calculate position in world space
const worldX=(centerX - pan.x) / scale;
const worldY=(centerY - pan.y) / scale;

// Calculate new scale
const newScale=Math.max(scale * 0.8,0.2);

// Calculate new pan to keep the center point fixed
const newPanX=centerX - worldX * newScale;
const newPanY=centerY - worldY * newScale;

setScale(newScale);
setPan({x: newPanX,y: newPanY});
},[scale,pan]);

// Touch event handlers
const handleTouchStart=useCallback((e)=> {
setIsCanvasActive(true);

if (e.touches.length===1) {
// Single touch - prepare for panning
setIsDragging(true);
setDragStart({
x: e.touches[0].clientX - pan.x,
y: e.touches[0].clientY - pan.y
});
} else if (e.touches.length===2) {
// Two touches - prepare for pinch zoom
const dx=e.touches[0].clientX - e.touches[1].clientX;
const dy=e.touches[0].clientY - e.touches[1].clientY;
const distance=Math.sqrt(dx * dx + dy * dy);
setLastTouchDistance(distance);

// Calculate pinch center
const centerX=(e.touches[0].clientX + e.touches[1].clientX) / 2;
const centerY=(e.touches[0].clientY + e.touches[1].clientY) / 2;
setLastPinchCenter({x: centerX,y: centerY});
}
},[pan]);

const handleTouchMove=useCallback((e)=> {
e.preventDefault();

// Pan with single touch
if (e.touches.length===1 && isDragging) {
setPan({
x: e.touches[0].clientX - dragStart.x,
y: e.touches[0].clientY - dragStart.y
});
}
// Pinch zoom with two touches
else if (e.touches.length===2 && lastTouchDistance !==null) {
const dx=e.touches[0].clientX - e.touches[1].clientX;
const dy=e.touches[0].clientY - e.touches[1].clientY;
const distance=Math.sqrt(dx * dx + dy * dy);

// Calculate zoom factor
const factor=distance / lastTouchDistance;
const newScale=Math.min(Math.max(scale * factor,0.2),3);

// Calculate new pinch center
const centerX=(e.touches[0].clientX + e.touches[1].clientX) / 2;
const centerY=(e.touches[0].clientY + e.touches[1].clientY) / 2;

// Convert pinch center to world coordinates before scaling
const canvas=canvasRef.current;
if (canvas && lastPinchCenter) {
const rect=canvas.getBoundingClientRect();
const worldX=(lastPinchCenter.x - rect.left - pan.x) / scale;
const worldY=(lastPinchCenter.y - rect.top - pan.y) / scale;

// Calculate new pan to keep the pinch center fixed
const newPanX=centerX - rect.left - worldX * newScale;
const newPanY=centerY - rect.top - worldY * newScale;

setScale(newScale);
setPan({x: newPanX,y: newPanY});

// Update last distance and center
setLastTouchDistance(distance);
setLastPinchCenter({x: centerX,y: centerY});
}
}
},[isDragging,dragStart,lastTouchDistance,lastPinchCenter,scale,pan]);

const handleTouchEnd=useCallback(()=> {
setIsDragging(false);
setLastTouchDistance(null);
setLastPinchCenter(null);
setIsCanvasActive(false);
},[]);

// Mouse enter/leave handlers for scroll prevention
const handleMouseEnter=useCallback(()=> {
setIsCanvasActive(true);
},[]);

const handleMouseLeave=useCallback(()=> {
setIsCanvasActive(false);
setIsDragging(false);
},[]);

// Setup canvas with responsive sizing
useEffect(()=> {
const canvas=canvasRef.current;
const container=containerRef.current;
if (!canvas || !container) return;

const resizeCanvas=()=> {
const rect=container.getBoundingClientRect();
canvas.width=rect.width;
canvas.height=rect.height;
draw();
};

resizeCanvas();
window.addEventListener('resize',resizeCanvas);

return ()=> window.removeEventListener('resize',resizeCanvas);
},[draw]);

// Redraw when dependencies change
useEffect(()=> {
  draw();
},[draw,venueZones]);

return (
<div 
className="relative w-full aspect-[4/3] max-h-[600px] rounded-lg overflow-hidden"
style={{backgroundColor: '#3f3f4680'}}
>
{/* Controls - Vertical Layout */}
<div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
<button
onClick={zoomIn}
className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
title="Zoom In"
>
<SafeIcon icon={FiPlus} className="w-4 h-4" />
</button>
<button
onClick={zoomOut}
className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
title="Zoom Out"
>
<SafeIcon icon={FiMinus} className="w-4 h-4" />
</button>
<button
onClick={()=> fitToView()}
className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
title="Fit to View"
>
<SafeIcon icon={FiMove} className="w-4 h-4" />
</button>
</div>

{/* Canvas Container */}
<div
ref={containerRef}
className="w-full h-full cursor-grab"
style={{
cursor: isDragging ? 'grabbing' : 'grab',
backgroundColor: '#3f3f4680'
}}
onMouseEnter={handleMouseEnter}
onMouseLeave={handleMouseLeave}
>
<canvas
ref={canvasRef}
onMouseDown={handleMouseDown}
onMouseMove={handleMouseMove}
onMouseUp={handleMouseUp}
onWheel={handleWheel}
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}
onTouchCancel={handleTouchEnd}
className="w-full h-full"
/>
</div>

{/* Capacity Selection Modal */}
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
{/* ИСПРАВЛЕНО: Используем динамическое значение из getElementCapacityInfo */}
<p className="text-gray-400 text-sm mb-2">
Free seats: {getElementCapacityInfo(selectedCapacityElement).free}
</p>
<label className="block text-sm font-medium text-gray-400 mb-2">
Number of seats to select:
</label>
<select
value={capacityToSelect}
onChange={(e)=> setCapacityToSelect(parseInt(e.target.value))}
className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
>
{Array.from(
{length: getElementCapacityInfo(selectedCapacityElement).free},
(_,i)=> i + 1
).map(num=> (
<option key={num} value={num}>{num}</option>
))}
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
className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors"
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

export default VenueSeatingChart;