import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDownload, FiRefreshCw } = FiIcons;

const TicketPreview = ({ settings, onDownload, onRefresh, ticketData, previewRef }) => {
  const sampleTicketData = {
    eventTitle: 'Концерт группы "Пример"',
    eventDate: '15 декабря 2024',
    eventTime: '20:00',
    eventLocation: 'Концертный зал "Олимпийский"',
    orderNumber: 'TW-123456',
    seatInfo: 'Партер, ряд 5, место 12',
    price: '2500 ₽',
    customerName: 'Иван Петров',
    ticketNumber: 'T-001'
  };

  // Используем реальные данные билета, если они переданы из родительского компонента
  const data = ticketData || sampleTicketData;

  const getQRSize = () => {
    switch (settings.qrCode.size) {
      case 'small': return 64;
      case 'large': return 128;
      default: return 96;
    }
  };

  const getQRPosition = () => {
    const size = getQRSize();
    const positions = {
      'top-left': { top: 16, left: 16 },
      'top-right': { top: 16, right: 16 },
      'bottom-left': { bottom: 16, left: 16 },
      'bottom-right': { bottom: 16, right: 16 },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    };
    return positions[settings.qrCode.position] || positions['bottom-right'];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-4"
    >
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Предпросмотр билета
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={onRefresh} 
            className="flex items-center gap-2 px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition text-sm"
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
          ref={previewRef}
          className="relative mx-auto rounded-lg shadow-lg overflow-hidden"
          style={{
            width: '400px',
            height: settings.design.layout === 'horizontal' ? '200px' : '600px',
            backgroundColor: settings.colorScheme.background,
            color: settings.colorScheme.text
          }}
        >
          {/* Company Logo */}
          {settings.design.showCompanyLogo && settings.companyLogo && (
            <div className="absolute top-4 left-4">
              <img 
                src={settings.companyLogo} 
                alt="Company Logo" 
                className="h-8 w-auto object-contain" 
              />
            </div>
          )}

          {/* QR Code */}
          {settings.design.showQRCode && (
            <div 
              className="absolute"
              style={{
                ...getQRPosition(),
                width: getQRSize(),
                height: getQRSize()
              }}
            >
              <div 
                className="w-full h-full bg-black flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: settings.colorScheme.text }}
              >
                QR
              </div>
            </div>
          )}

          {/* Ticket Content */}
          <div className="p-6 h-full flex flex-col justify-center">
            <div className="text-center mb-4">
              <h1 
                className="font-bold mb-2"
                style={{ 
                  color: settings.colorScheme.primary,
                  fontSize: settings.design.fontSize === 'large' ? '24px' : settings.design.fontSize === 'small' ? '16px' : '20px'
                }}
              >
                {data.eventTitle}
              </h1>
              {settings.ticketContent.showDateTime && (
                <div className="mb-2">
                  <div className="font-medium">{data.eventDate}</div>
                  <div className="text-sm opacity-75">{data.eventTime}</div>
                </div>
              )}
              {settings.ticketContent.showVenueInfo && (
                <div className="mb-2 text-sm opacity-75">
                  {data.eventLocation}
                </div>
              )}
            </div>

            <div 
              className="border-t border-dashed my-4"
              style={{ borderColor: settings.colorScheme.secondary }}
            />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Билет №:</span>
                <span className="font-mono">{data.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Заказ №:</span>
                <span className="font-mono">{data.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Место:</span>
                <span>{data.seatInfo}</span>
              </div>
              {settings.ticketContent.showPrice && (
                <div className="flex justify-between">
                  <span>Цена:</span>
                  <span
                    className="font-bold"
                    style={{ color: settings.colorScheme.accent }}
                  >
                    {data.price}
                  </span>
                </div>
              )}
            </div>

            {/* Company Info */}
            {settings.companyInfo.name && (
              <div 
                className="mt-4 pt-4 border-t text-xs opacity-50"
                style={{ borderColor: settings.colorScheme.secondary }}
              >
                <div>{settings.companyInfo.name}</div>
                {settings.companyInfo.phone && <div>{settings.companyInfo.phone}</div>}
                {settings.companyInfo.website && <div>{settings.companyInfo.website}</div>}
              </div>
            )}

            {/* Custom Instructions */}
            {settings.ticketContent.customInstructions && (
              <div className="mt-2 text-xs opacity-75">
                {settings.ticketContent.customInstructions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">
          Параметры шаблона
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="font-medium">Шаблон:</span> {settings.design.template}
          </div>
          <div>
            <span className="font-medium">Размер шрифта:</span> {settings.design.fontSize}
          </div>
          <div>
            <span className="font-medium">Ориентация:</span> {settings.design.layout}
          </div>
          <div>
            <span className="font-medium">QR код:</span> {settings.qrCode.size} ({settings.qrCode.position})
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketPreview;
