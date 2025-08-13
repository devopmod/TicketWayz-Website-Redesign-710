import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { renderTicket } from '../../utils/renderTicket';

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
  settings = {},
}) => {
  const sampleOrder = {
    event: {
      title: 'Концерт группы "Пример"',
      date: '2024-12-15T20:00:00',
      location: 'Концертный зал "Олимпийский"',
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

  const [html, setHtml] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const rendered = await renderTicket({
        order: o,
        seat: s,
        heroUrl,
        accent,
        darkHeader,
        showPrice,
        showQr,
        showTerms,
        radius,
        shadow,
        qrValue,
        settings
      });
      if (active) setHtml(rendered);
    })();
    return () => {
      active = false;
    };
  }, [o, s, heroUrl, accent, darkHeader, showPrice, showQr, showTerms, radius, shadow, qrValue, settings]);

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
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </motion.div>
  );
};

export default TicketPreview;
