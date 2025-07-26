import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiDownload, FiHome } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const orderNumber = `TW-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Автоматический редирект на главную страницу через 10 секунд
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 60000); // 1 минута
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-zinc-800 rounded-lg p-8 text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiCheck} className="text-4xl text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Спасибо за заказ!</h1>
        <p className="text-zinc-400 mb-6">
          Ваш заказ #{orderNumber} успешно оформлен.
          Мы отправили подтверждение на ваш email.
        </p>
        
        <div className="bg-zinc-700 p-4 rounded-lg mb-6">
          <h2 className="font-medium mb-2">Детали заказа</h2>
          <div className="flex justify-between mb-2">
            <span className="text-zinc-400">Событие:</span>
            <span>MAX KORZH</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-zinc-400">Дата:</span>
            <span>09 августа 2025 г.</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-zinc-400">Место:</span>
            <span>Warszawa</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-zinc-400">Билеты:</span>
            <span>VIP x2</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t border-zinc-600">
            <span>Итого:</span>
            <span>315 €</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium">
            <SafeIcon icon={FiDownload} />
            <span>Скачать билеты</span>
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition"
          >
            <SafeIcon icon={FiHome} />
            <span>На главную</span>
          </button>
        </div>
        
        <p className="text-xs text-zinc-500">
          Возникли вопросы? Свяжитесь с нашей службой поддержки: support@ticketwayz.com
        </p>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;