import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiInfo, FiX, FiPlus, FiMinus, FiArrowLeft } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { events } from '../assets/mockData';

const VenuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  // Определяем зоны для мероприятия
  const zones = [
    { id: 'zone1', name: 'VIP', price: 150, color: '#FFD700', availableSeats: 20 },
    { id: 'zone2', name: 'Фан-зона', price: 80, color: '#FF6B6B', availableSeats: 50 },
    { id: 'zone3', name: 'Стандарт', price: 50, color: '#4ECDC4', availableSeats: 100 },
    { id: 'zone4', name: 'Балкон', price: 40, color: '#9D8DF1', availableSeats: 30 }
  ];

  // Функция для получения стилей бейджика зоны
  const getZoneBadgeStyles = (zoneName) => {
    switch (zoneName) {
      case 'VIP': return 'bg-yellow-100 text-yellow-700';
      case 'Фан-зона': return 'bg-red-100 text-red-700';
      case 'Стандарт': return 'bg-teal-100 text-teal-700';
      case 'Балкон': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    // Имитация загрузки данных
    setLoading(true);
    // Находим событие по ID
    const foundEvent = events.find(e => e.id === id);
    setTimeout(() => {
      setEvent(foundEvent);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
  };

  const handleSeatToggle = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length > 0) {
      // В реальном приложении здесь можно сохранить выбранные места в localStorage или Redux
      navigate('/checkout');
    }
  };

  const generateSeats = (zoneId, count) => {
    const seats = [];
    const rows = Math.ceil(Math.sqrt(count));
    const seatsPerRow = Math.ceil(count / rows);

    for (let row = 0; row < rows; row++) {
      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatNumber = row * seatsPerRow + seat + 1;
        if (seatNumber <= count) {
          seats.push({
            id: `${zoneId}-r${row+1}s${seat+1}`,
            row: row + 1,
            seat: seat + 1,
            number: seatNumber,
            status: Math.random() > 0.2 ? 'available' : 'taken' // Случайно определяем занятые места
          });
        }
      }
    }
    return seats;
  };

  // Генерируем места для каждой зоны
  const zoneSeats = {};
  zones.forEach(zone => {
    zoneSeats[zone.id] = generateSeats(zone.id, zone.availableSeats);
  });

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d);
    const year = d.getFullYear();
    return `${day} ${month} • ${weekday} • 20:00 • ${year}`;
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

  if (!event) {
    return (
      <div className="container mx-auto max-w-[960px] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Событие не найдено</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">Запрошенное событие не существует или было удалено.</p>
        <button
          onClick={() => navigate('/events')}
          className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
        >
          Просмотреть все события
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[960px] px-4 py-8">
      {/* Новая шапка события */}
      <div className="flex flex-row w-full max-w-100vw min-w-0 mb-6">
        {/* Стрелка назад */}
        <div className="flex items-center justify-center h-full">
          <a onClick={() => navigate(-1)} className="cursor-pointer flex items-center h-full">
            <SafeIcon icon={FiArrowLeft} className="text-zinc-400 h-5 w-5" />
          </a>
        </div>

        {/* Текстовый блок + бейджи */}
        <div className="flex flex-col justify-center w-full ml-4">
          <span className="text-yellow-500 text-sm font-bold leading-tight break-words mb-1">
            {event.title}
          </span>
          <span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium leading-tight mb-1 break-words">
            {formatDate(event.date)}
          </span>
          <span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium leading-tight mb-2 break-words">
            {event.location}
          </span>
          <div className="flex gap-1 flex-wrap">
            {zones.map(zone => (
              <span
                key={zone.id}
                className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center whitespace-nowrap ${getZoneBadgeStyles(zone.name)}`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: zone.color }}
                ></span>
                {zone.name}&nbsp;€{zone.price}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Выберите зону</h2>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <SafeIcon icon={showInfo ? FiX : FiInfo} className="text-zinc-400" />
          </button>
        </div>

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-lg mb-4"
          >
            <h3 className="font-medium mb-2 text-zinc-900 dark:text-white">Информация о зонах</h3>
            <ul className="space-y-2">
              {zones.map(zone => (
                <li key={zone.id} className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: zone.color }}
                  ></div>
                  <span className="text-zinc-900 dark:text-white">{zone.name} - {zone.price} €</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => handleZoneSelect(zone)}
              className={`p-4 rounded-lg border ${
                selectedZone?.id === zone.id
                  ? 'border-yellow-500 bg-zinc-200 dark:bg-zinc-800'
                  : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              } transition`}
            >
              <div
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: zone.color }}
              ></div>
              <h3 className="font-medium text-zinc-900 dark:text-white">{zone.name}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{zone.price} €</p>
            </button>
          ))}
        </div>
      </div>

      {selectedZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
            Выберите места в зоне "{selectedZone.name}"
          </h2>

          <div className="mb-8 overflow-auto">
            {/* Схема мест */}
            <div className="min-w-[600px] p-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
              {/* Сцена */}
              <div className="w-3/4 h-12 mx-auto mb-8 bg-zinc-300 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-zinc-600 dark:text-zinc-400">Сцена</span>
              </div>

              {/* Места */}
              <div className="grid grid-cols-10 gap-2 max-w-md mx-auto">
                {zoneSeats[selectedZone.id].map(seat => (
                  <button
                    key={seat.id}
                    disabled={seat.status === 'taken'}
                    onClick={() => seat.status === 'available' && handleSeatToggle(seat)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-xs ${
                      seat.status === 'taken'
                        ? 'bg-zinc-400 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-500 cursor-not-allowed'
                        : selectedSeats.includes(seat)
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 text-zinc-900 dark:text-white'
                    }`}
                    title={`Ряд ${seat.row}, Место ${seat.seat}`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-200 dark:bg-zinc-800 p-4 rounded-lg">
            <div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-1">Выбрано мест: {selectedSeats.length}</p>
              <p className="font-bold text-xl text-zinc-900 dark:text-white">
                Итого: {selectedSeats.length * selectedZone.price} €
              </p>
            </div>
            <button
              onClick={handleProceedToCheckout}
              disabled={selectedSeats.length === 0}
              className={`px-6 py-3 rounded-lg font-medium ${
                selectedSeats.length > 0
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-zinc-400 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
              } transition`}
            >
              Перейти к оформлению
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VenuePage;