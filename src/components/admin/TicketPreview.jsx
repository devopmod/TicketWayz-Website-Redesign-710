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
  accent,
  darkHeader,
  showPrice = true,
  showTerms = true,
  radius,
  shadow,
  qrValue,
  settings = {}
}) => {
  const { qrCode = {}, design = {}, colorScheme = {}, ticketContent = {}, companyInfo = {} } = settings;
  const actualHero = heroUrl ?? design.heroUrl;
  const actualAccent = accent ?? design.accent ?? colorScheme.accent ?? '#10B981';
  const actualDarkHeader = darkHeader ?? design.darkHeader ?? false;
  const actualRadius = radius ?? design.rounded ?? 12;
  const actualShadow = shadow ?? (design.shadow !== undefined ? design.shadow : true);
  const backgroundColor = colorScheme.background || '#FFFFFF';
  const textColor = colorScheme.text || '#000000';
  const secondaryColor = colorScheme.secondary || '#6B7280';

  // Sample data used when no ticket information is provided
  const sampleOrder = {
    event: {
      title: 'Концерт группы "Пример"',
      date: '2024-12-15T20:00:00',
      location: 'Концертный зал "Олимпийский"',
      image: actualHero,
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
  if (s?.section) gridItems.push({ label: 'Section', value: s.section });
  if (s?.row_number) gridItems.push({ label: 'Row', value: s.row_number });
  if (s?.seat_number) gridItems.push({ label: 'Seat', value: s.seat_number });
  if (!s?.section && !s?.row_number && !s?.seat_number) {
    if (s?.zone?.name || s?.zone) gridItems.push({ label: 'Zone', value: s?.zone?.name || s.zone });
    else gridItems.push({ label: 'Admission', value: 'General' });
  }
  if (showPrice && price) gridItems.push({ label: 'Price', value: price, accent: true });

  const termsText = showTerms
    ? [event.note, ticketContent.customInstructions, ticketContent.termsAndConditions, o.terms]
        .filter(Boolean)
        .join(' ')
    : '';
  const companyLines = [companyInfo.name, companyInfo.phone, companyInfo.website].filter(Boolean);

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
          className={`relative mx-auto ${actualShadow ? 'shadow-lg' : ''}`}
          style={{ width: '400px', height: '600px', borderRadius: actualRadius, backgroundColor }}
        >
          <div className="flex h-full flex-col overflow-hidden" style={{ borderRadius: actualRadius, color: textColor }}>
            {/* Hero section */}
            <div className="relative h-[120px] w-full flex-shrink-0">
              {actualHero ? (
                <img src={actualHero} alt="Hero" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ backgroundColor: actualAccent }} />
              )}
              {actualDarkHeader && <div className="absolute inset-0 bg-black/40" />}
              <span
                className="absolute bottom-2 left-2 px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: actualAccent }}
              >
                {brandName}
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-5 text-sm">
              {event.title && (
                <h1 className="text-lg font-bold" style={{ color: actualAccent }}>
                  {event.title}
                </h1>
              )}
              {event.date && (
                <div className="mt-1">
                  <div>{date}</div>
                  <div className="text-xs opacity-75">{time}</div>
                </div>
              )}
              {event.location && <div className="mt-1 opacity-75">{event.location}</div>}

              <div
                className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-4"
                style={{ borderColor: secondaryColor }}
              >
                {gridItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="text-[10px] uppercase" style={{ color: secondaryColor }}>
                      {item.label}
                    </div>
                    <div
                      className={`text-sm ${item.accent ? 'font-bold' : ''}`}
                      style={item.accent ? { color: actualAccent } : {}}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {companyLines.length > 0 && (
                <div className="mt-4 text-[10px]" style={{ color: secondaryColor }}>
                  {companyLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}

              {termsText && (
                <div className="mt-2 text-xs" style={{ color: textColor }}>
                  {termsText}
                </div>
              )}
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
      </div>
    </motion.div>
  );
};

export default TicketPreview;

