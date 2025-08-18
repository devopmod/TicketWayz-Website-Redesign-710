import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { updateEventPrices } from '../../../services/eventService';

/**
 * Modal for editing event pricing
 * @param {{ event: object, onClose: Function, onSave: Function }} props 
 */
const PricingModal = ({ event, onClose, onSave }) => {
  const [prices, setPrices] = useState(event?.prices || []);

  const handleChange = (index, value) => {
    setPrices(prev =>
      prev.map((p, i) => (i === index ? { ...p, price: value } : p))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedPrices = prices.map(p => ({
      id: p.id,
      category_id: p.category_id || p.category?.id,
      price: Number(p.price)
    }));

    try {
      await updateEventPrices(event.id, updatedPrices);
      onSave && onSave(prices);
      onClose();
    } catch (err) {
      console.error('Error updating prices:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-lg p-6"
      >
        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          Update Prices
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {prices.map((priceItem, idx) => (
            <div
              key={priceItem.id || priceItem.category_id || idx}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {priceItem.category?.name || priceItem.category_name}
              </span>
              <input
                type="number"
                step="0.01"
                className="w-32 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-transparent text-right text-zinc-800 dark:text-zinc-100"
                value={priceItem.price}
                onChange={(e) => handleChange(idx, e.target.value)}
              />
            </div>
          ))}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PricingModal;

