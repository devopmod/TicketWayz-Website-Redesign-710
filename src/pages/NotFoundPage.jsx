import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto max-w-[960px] px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold text-yellow-500">404</h1>
        <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
        <p className="text-zinc-400 mb-8">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
          >
            Вернуться назад
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
          >
            На главную
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;