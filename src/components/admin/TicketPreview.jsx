import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { formatDateTime } from '../../utils/formatDateTime';
import QRCode from 'qrcode';

const { FiDownload, FiRefreshCw } = FiIcons;

const TicketPreview = ({
  order,
  seat,
  onDownload,
  onRefresh,
  heroUrl,
  accent,
  darkHeader,
  showPrice = true,
  showQr = true,
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
  const actualRadius = radius ?? design.rounded ?? 24;
  const actualShadow = shadow ?? (design.shadow !== undefined ? design.shadow : true);
  const backgroundColor = colorScheme.background || '#FFFFFF';
  const textColor = colorScheme.text || '#111827';
  const grayColor = colorScheme.gray || '#6B7280';
  const lightGray = colorScheme.lightGray || '#D1D5DB';

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
    id: 'SAMPLE-SEAT',
    section: 'Партер',
    row_number: '5',
    seat_number: '12',
    price: '2500 ₽'
  };

  const o = order || sampleOrder;
  const s = seat || sampleSeat;

  const event = o.event || {};
  const brandName = companyInfo.brand || companyInfo.name || o.company?.name || 'TicketWayz';
  const { dateTime } = event.date ? formatDateTime(event.date) : { dateTime: '' };
  const price = s?.price || o.price || o.totalPrice;
  const ticketId = s?.id || o.orderNumber || o.id;

  const showPriceFinal = showPrice && ticketContent.showPrice !== false;
  const showTermsFinal = showTerms && ticketContent.showTerms !== false;
  const showQrFinal = showQr && design.showQRCode !== false;

  const gridItems = [];
  if (s?.section || s?.row_number || s?.seat_number) {
    if (s?.section) gridItems.push(['SECTION', s.section]);
    if (s?.row_number) gridItems.push(['ROW', s.row_number]);
    if (s?.seat_number) gridItems.push(['SEAT', s.seat_number]);
  } else {
    gridItems.push(['ADMISSION', 'GA']);
  }
  if (showPriceFinal && price) gridItems.push(['PRICE', price]);

  const termsText = showTermsFinal
    ? [event.note, ticketContent.customInstructions, ticketContent.termsAndConditions, o.terms]
        .filter(Boolean)
        .join(' ')
    : '';

  const qrString = qrCode.value || qrValue || ticketId || 'Ticket';
  const qrBlockSize = 164;
  const qrInnerSize = qrBlockSize - 32;
  const [qrSvg, setQrSvg] = useState('');

  useEffect(() => {
    if (!showQrFinal) {
      setQrSvg('');
      return;
    }
    QRCode.toString(qrString, { type: 'svg', margin: 0, width: qrInnerSize })
      .then(setQrSvg)
      .catch(() => setQrSvg(''));
  }, [qrString, showQrFinal, qrInnerSize]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Предпросмотр билета</h3>
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

      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
        <div
          className={`mx-auto ${actualShadow ? 'shadow-lg' : ''} rounded-[${actualRadius}px]`}
          style={{ width: '560px', backgroundColor }}
        >
          <div className="relative h-48 rounded-t-[inherit] overflow-hidden">
            {actualHero ? (
              <img src={actualHero} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: actualAccent }} />
            )}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${
                actualDarkHeader ? 'from-black/60' : 'from-black/30'
              } to-black/0`}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: actualAccent }} />
                {brandName}
              </div>
            </div>
          </div>

          <div
            className="-mt-6 rounded-b-[inherit] px-6 pb-8 pt-8"
            style={{ backgroundColor, color: textColor }}
          >
            {event.title && <h1 className="text-2xl font-bold">{event.title}</h1>}
            {event.date && (
              <div className="mt-2 text-base" style={{ color: grayColor }}>
                {dateTime}
              </div>
            )}
            {event.location && (
              <div className="mt-1 text-base" style={{ color: grayColor }}>
                {event.location}
              </div>
            )}

            {gridItems.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
                {gridItems.map(([label, value], idx) => (
                  <div key={idx}>
                    <div className="text-xs" style={{ color: grayColor }}>
                      {label}
                    </div>
                    <div className="text-lg font-semibold" style={{ color: actualAccent }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showQrFinal && qrSvg && (
              <div className="mt-8 flex flex-col items-center">
                <div
                  className="flex items-center justify-center rounded-xl border"
                  style={{ width: qrBlockSize, height: qrBlockSize, borderColor: lightGray }}
                >
                  <div className="h-[132px] w-[132px]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                </div>
                {qrCode.value && (
                  <div className="mt-4 text-xs" style={{ color: grayColor }}>
                    {qrCode.value}
                  </div>
                )}
                {ticketId && (
                  <div className="mt-1 text-xs" style={{ color: grayColor }}>
                    ID: {ticketId}
                  </div>
                )}
              </div>
            )}

            {termsText && (
              <div className="mt-8 border-t border-dashed pt-4 text-xs" style={{ borderColor: lightGray, color: grayColor }}>
                {termsText}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketPreview;
