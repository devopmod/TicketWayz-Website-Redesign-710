import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import TicketTemplate from '../ticket/TicketTemplate.jsx';
import { buildTermsText } from '../../utils/ticketUtils.js';

const { FiDownload, FiRefreshCw } = FiIcons;

const TicketPreview = ({
  ticketData,
  onDownload,
  onRefresh,
  accent,
  darkHeader,
  showPrice = true,
  showQr = true,
  showTerms = true,
  rounded,
  shadow,
  qrValue,
  settings = {},
}) => {
  const sampleTicket = {
    brand: 'TicketWayz',
    artist: 'Концерт группы "Пример"',
    date: '15.12.2024',
    time: '20:00',
    venue: 'Концертный зал "Олимпийский"',
    address: 'Пожалуйста, приходите за 30 минут до начала.',
    section: 'Партер',
    row: '5',
    seat: '12',
    price: '2500 ₽',
    ticketId: 'TW-123456',
    ticketType: 'seat',
    qrValue: 'TW-123456',
  };

  const t = { ...sampleTicket, ...(ticketData || {}) };

  const ticketRef = useRef(null);

  const data = {
    heroImage: t.heroImage || settings.design?.heroUrl,
    brand: t.brand,
    artist: t.artist,
    date: t.date,
    time: t.time,
    venue: t.venue,
    address: t.address,
    section: t.section,
    row: t.row,
    seat: t.seat,
    price: t.price,
    ticketId: t.ticketId,
    ticketType: t.ticketType,
    terms: buildTermsText({}, settings),
  };

  const options = {
    accent,
    darkHeader,
    showPrice,
    showQr,
    showTerms,
    rounded,
    radius: rounded,
    shadow,
    qrValue: qrValue || t.qrValue || t.ticketId,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Предпросмотр билета</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onRefresh(ticketRef.current)}
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
            onClick={() => onDownload(ticketRef.current)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            Скачать PDF
          </button>
        </div>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
        <TicketTemplate ref={ticketRef} data={data} options={options} />
      </div>
    </motion.div>
  );
};

export default TicketPreview;
