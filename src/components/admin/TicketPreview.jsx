import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { formatDateTime } from '../../utils/formatDateTime';
import QRCode from 'qrcode';

const { FiDownload, FiRefreshCw } = FiIcons;

/**
 * Ticket preview component used in the admin panel. The layout mirrors the
 * structure used in the PDF export (see utils/pdfGenerator.js) so that both
 * features operate on the same data format.
 */
const TicketPreview = ({
  order,
  seat,
  onDownload,
  onRefresh,
  heroUrl,
  accent = '#10B981',
  darkHeader = false,
  showPrice = true,
  showTerms = true,
  radius = 12,
  shadow = true,
  qrValue,
  settings = {}
}) => {
  // Sample data used when no ticket information is provided
  const sampleOrder = {
    event: {
      title: 'Концерт группы "Пример"',
      date: '2024-12-15T20:00:00',
      location: 'Концертный зал "Олимпийский"',
      image: heroUrl,
      note: 'Пожалуйста, приходите за 30 минут до начала.'
    },
    orderNumber: 'TW-123456',
    price: '2500 ₽',
    company: { name: 'TicketWayz' }
  };
  const sampleSeat = {
    section: 'Партер',
    row_number: '5',
    seat_number: '12',
    price: '2500 ₽'
  };

  const o = order || sampleOrder;
  const s = seat || sampleSeat;

  const event = o.event || {};
  const brandName = o.company?.name || 'TicketWayz';
  const { date, time } = event.date ? formatDateTime(event.date) : { date: '', time: '' };
  const price = s?.price || o.price || o.totalPrice;

  const gridItems = [];
  if (s?.section) gridItems.push({ label: 'Секция', value: s.section });
  if (s?.row_number) gridItems.push({ label: 'Ряд', value: s.row_number });
  if (s?.seat_number) gridItems.push({ label: 'Место', value: s.seat_number });
  if (gridItems.length === 0) gridItems.push({ label: 'Admission', value: 'General' });
  if (showPrice && price) gridItems.push({ label: 'Цена', value: price, accent: true });

  const termsText = showTerms ? [event.note, o.terms].filter(Boolean).join(' ') : '';

  const { qrCode = {}, design = {} } = settings;
  const showQr = design.showQRCode !== false && qrValue;
  const sizeMap = { small: 48, medium: 72, large: 96 };
  const qrSize = sizeMap[qrCode.size] || 64;
  const [qrSvg, setQrSvg] = useState('');

  useEffect(() => {
    if (!showQr) {
      setQrSvg('');
      return;
    }
    QRCode.toString(qrValue, { type: 'svg', margin: 0, width: qrSize })
      .then(setQrSvg)
      .catch(() => setQrSvg(''));
  }, [qrValue, qrSize, showQr]);

  const positions = {
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  };

  const qrStyle = {
    width: qrSize,
    height: qrSize,
    ...(positions[qrCode.position] || positions['bottom-right'])
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Предпросмотр билета
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className={[
              'flex items-center gap-2 px-3 py-1',
              'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
              'rounded',
              'hover:bg-zinc-300 dark:hover:bg-zinc-600',
              'transition text-sm'
            ].join(' ')}
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
            Обновить
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            Скачать PDF
          </button>
        </div>
      </div>

      {/* Ticket Preview */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
        <div
          className={`relative mx-auto overflow-hidden ${shadow ? 'shadow-lg' : ''}`}
          style={{ width: '400px', borderRadius: radius }}
        >
          {/* Hero section */}
          <div className="relative h-32 w-full">
            {heroUrl ? (
              <img src={heroUrl} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: accent }} />
            )}
            {darkHeader && <div className="absolute inset-0 bg-black/40" />}
            <div className="absolute bottom-2 left-2">
              <span className="text-white text-xs font-medium px-2 py-1" style={{ backgroundColor: accent }}>
                {brandName}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2 text-sm" style={{ color: '#000' }}>
            {event.title && (
              <h1 className="text-lg font-bold" style={{ color: accent }}>
                {event.title}
              </h1>
            )}
            {event.date && (
              <div>
                <div>{date}</div>
                <div className="opacity-75 text-xs">{time}</div>
              </div>
            )}
            {event.location && <div className="opacity-75">{event.location}</div>}

            <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-dashed border-zinc-300">
              {gridItems.map((item, idx) => (
                <div key={idx}>
                  <div className="text-[10px] uppercase opacity-60">{item.label}</div>
                  <div
                    className={`text-sm ${item.accent ? 'font-bold' : ''}`}
                    style={item.accent ? { color: accent } : {}}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {termsText && <div className="mt-2 text-xs opacity-75">{termsText}</div>}
          </div>

            {/* QR code */}
            {showQr && qrSvg && (
              <div
                className="absolute"
                style={qrStyle}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default TicketPreview;

