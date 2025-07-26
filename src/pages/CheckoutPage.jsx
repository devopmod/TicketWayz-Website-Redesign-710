import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Очищаем ошибку для поля, которое редактируется
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Введите имя';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    }
    
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Введите номер карты';
    } else if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Номер карты должен содержать 16 цифр';
    }
    
    if (!formData.expiry.trim()) {
      newErrors.expiry = 'Введите срок действия';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Формат: ММ/ГГ';
    }
    
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'Введите CVV';
    } else if (!/^\d{3}$/.test(formData.cvv)) {
      newErrors.cvv = 'CVV должен содержать 3 цифры';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Имитация отправки данных на сервер
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/thank-you');
      }, 1500);
    }
  };
  
  return (
    <div className="container mx-auto max-w-[960px] px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Имя</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400">
                      <SafeIcon icon={FiUser} />
                    </span>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                        errors.firstName ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Фамилия</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400">
                      <SafeIcon icon={FiUser} />
                    </span>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400">
                      <SafeIcon icon={FiMail} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                        errors.email ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400">
                      <SafeIcon icon={FiPhone} />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                        errors.phone ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Данные оплаты</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Номер карты</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400">
                      <SafeIcon icon={FiCreditCard} />
                    </span>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                        errors.cardNumber ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                  </div>
                  {errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Срок действия</label>
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className={`w-full bg-zinc-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 ${
                        errors.expiry ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                      }`}
                    />
                    {errors.expiry && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-zinc-400">
                        <SafeIcon icon={FiLock} />
                      </span>
                      <input
                        type="password"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        maxLength="3"
                        className={`w-full bg-zinc-700 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 ${
                          errors.cvv ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-yellow-500'
                        }`}
                      />
                    </div>
                    {errors.cvv && (
                      <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-medium ${
                isSubmitting 
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'bg-yellow-500 text-black hover:bg-yellow-400'
              } transition`}
            >
              {isSubmitting ? 'Обработка...' : 'Оплатить'}
            </button>
          </motion.form>
        </div>
        
        <div>
          <div className="bg-zinc-800 p-6 rounded-lg sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Ваш заказ</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">VIP Зона x2</span>
                <span>300 €</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-zinc-400">Сервисный сбор</span>
                <span>15 €</span>
              </div>
              
              <div className="border-t border-zinc-700 pt-4 flex justify-between font-bold">
                <span>Итого</span>
                <span>315 €</span>
              </div>
            </div>
            
            <div className="text-xs text-zinc-400">
              <p className="mb-2">
                Нажимая "Оплатить", вы соглашаетесь с условиями покупки и политикой конфиденциальности.
              </p>
              <p>
                Билеты будут отправлены на указанный email после успешной оплаты.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;