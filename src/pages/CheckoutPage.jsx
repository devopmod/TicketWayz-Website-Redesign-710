import React,{useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {FiCreditCard,FiUser,FiMail,FiPhone,FiLock} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import supabase from '../lib/supabase';

const CheckoutPage=()=> {
  const navigate=useNavigate();
  const [formData,setFormData]=useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [errors,setErrors]=useState({});
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [selectedSeats,setSelectedSeats]=useState([]);
  const [eventDetails,setEventDetails]=useState(null);
  const [paymentMethod,setPaymentMethod]=useState('card');// 'card' или 'applepay'
  const [isApplePayAvailable,setIsApplePayAvailable]=useState(false);

  // Проверяем доступность Apple Pay
  useEffect(()=> {
    // Проверяем наличие Apple Pay в браузере
    const checkApplePay=()=> {
      // Для тестирования всегда показываем Apple Pay
      // В реальном приложении это должно быть:
      // if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      //   setIsApplePayAvailable(true);
      // }

      // Временно всегда показываем Apple Pay для демонстрации
      setIsApplePayAvailable(true);

      // Альтернативно,можно проверить User Agent для Safari/iOS
      const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isSafari || isIOS) {
        setIsApplePayAvailable(true);
      }
    };

    checkApplePay();
  },[]);

  // Format price with proper decimal places
  const formatPrice=(price)=> {
    return price ? Number(price).toFixed(2) : '0.00';
  };

  // Load selected seats from sessionStorage
  useEffect(()=> {
    const storedSeats=sessionStorage.getItem('selectedSeats');
    const storedEventDetails=sessionStorage.getItem('eventDetails');

    if (storedSeats) {
      try {
        const parsedSeats=JSON.parse(storedSeats).map(seat=> ({
          ...seat,
          section: seat.section,
          row_number: seat.row_number ?? (seat.type==='seat' ? seat.row : undefined),
          seat_number: seat.seat_number ?? (seat.type==='seat' ? seat.number : undefined)
        }));
        console.log('🎫 Loaded seats from sessionStorage:',parsedSeats);
        setSelectedSeats(parsedSeats);
      } catch (error) {
        console.error('Error parsing stored seats:',error);
        navigate('/');
      }
    } else {
      // No seats selected,redirect to home
      navigate('/');
    }

    if (storedEventDetails) {
      try {
        const parsedEvent=JSON.parse(storedEventDetails);
        if (!parsedEvent.image) {
          console.warn('Missing event.image in sessionStorage');
          parsedEvent.image=null;
        }
        if (!parsedEvent.note) {
          console.warn('Missing event.note in sessionStorage');
          parsedEvent.note='';
        }
        setEventDetails(parsedEvent);
      } catch (error) {
        console.error('Error parsing event details:',error);
      }
    }
  },[navigate]);

  const handleChange=(e)=> {
    const {name,value}=e.target;
    setFormData({...formData,[name]: value});
    
    // Очищаем ошибку для поля,которое редактируется
    if (errors[name]) {
      setErrors({...errors,[name]: ''});
    }
  };

  const validateForm=()=> {
    const newErrors={};

    if (paymentMethod==='card') {
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber='Введите номер карты';
      } else if (formData.cardNumber.replace(/\s/g,'').length !==16) {
        newErrors.cardNumber='Номер карты должен содержать 16 цифр';
      }

      if (!formData.expiry.trim()) {
        newErrors.expiry='Введите срок действия';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
        newErrors.expiry='Формат: ММ/ГГ';
      }

      if (!formData.cvv.trim()) {
        newErrors.cvv='Введите CVV';
      } else if (!/^\d{3}$/.test(formData.cvv)) {
        newErrors.cvv='CVV должен содержать 3 цифры';
      }
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName='Введите имя';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName='Введите фамилию';
    }
    if (!formData.email.trim()) {
      newErrors.email='Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email='Некорректный email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone='Введите телефон';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length===0;
  };

  // ИСПРАВЛЕННАЯ функция для создания пользователя с реальными данными
  const createOrGetUser=async ()=> {
    try {
      // Генерируем новый UUID для каждого пользователя
      const userId=crypto.randomUUID();

      // Проверяем,существует ли уже пользователь с таким email
      const {data: existingUser,error: checkError}=await supabase
        .from('user_meta')
        .select('id')
        .eq('email',formData.email.trim())
        .single();

      if (checkError && checkError.code !=='PGRST116') {// PGRST116=no rows found
        throw checkError;
      }

      if (existingUser) {
        // Пользователь с таким email уже существует,обновляем его данные
        const {data: updatedUser,error: updateError}=await supabase
          .from('user_meta')
          .update({
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone_number: formData.phone.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id',existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log('Updated existing user:',updatedUser);
        return existingUser.id;
      } else {
        // Создаем нового пользователя с реальными данными из формы
        const {data: newUser,error: createError}=await supabase
          .from('user_meta')
          .insert({
            id: userId,
            email: formData.email.trim(),
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone_number: formData.phone.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        console.log('Created new user:',newUser);
        return userId;
      }
    } catch (error) {
      console.error('Error creating/getting user:',error);
      throw error;
    }
  };

  // КРИТИЧНО ИСПРАВЛЕННАЯ функция для создания заказа и обновления статусов билетов
  const createOrder=async ()=> {
    try {
      console.log('🚀 Starting order creation with seats:',selectedSeats);

      // Валидация входных данных
      if (!selectedSeats || selectedSeats.length === 0) {
        throw new Error('Нет выбранных мест для заказа');
      }

      // 1. Создаем или получаем пользователя с реальными данными
      const userId=await createOrGetUser();
      console.log('✅ User ID:',userId);

      // 2. Создаем заказ
      const {data: order,error: orderError}=await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'paid',// Сразу устанавливаем статус "paid"
          total_price: calculateTotal(),
          currency: 'EUR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;
      console.log('✅ Created order:',order);

      // 3. КРИТИЧНО ИСПРАВЛЕННАЯ обработка каждого места с УНИКАЛЬНЫМИ ticket IDs
      for (const seat of selectedSeats) {
        console.log('🎫 Processing seat:',seat);

        // КРИТИЧНО: Обрабатываем все УНИКАЛЬНЫЕ ticket IDs для каждого элемента
        const ticketIds=seat.ticketIds || [seat.ticketId];
        const quantity=seat.quantity || 1;
        const unitPrice=seat.unitPrice || (seat.price / quantity);

        console.log(`🎫 Processing ${ticketIds.length} tickets for seat:`,{
          seatId: seat.id,
          ticketIds: ticketIds,
          quantity: quantity,
          unitPrice: unitPrice
        });

        // Проверяем что у нас достаточно УНИКАЛЬНЫХ ticket IDs
        if (ticketIds.length < quantity) {
          console.error(`❌ Not enough ticket IDs. Required: ${quantity}, Found: ${ticketIds.length}`);
          throw new Error(`Недостаточно билетов для места: ${seat.label}`);
        }

        // КРИТИЧНО: Убеждаемся что все ticket IDs уникальные
        const uniqueTicketIds=[...new Set(ticketIds)];
        if (uniqueTicketIds.length !== ticketIds.length) {
          console.error('❌ Duplicate ticket IDs found:',ticketIds);
          throw new Error(`Обнаружены дублирующиеся билеты для места: ${seat.label}`);
        }

        // Создаем order_item для каждого УНИКАЛЬНОГО билета отдельно
        for (let i=0;i < quantity;i++) {
          const ticketId=uniqueTicketIds[i];

          if (!ticketId) {
            console.error(`❌ No ticket ID found for seat ${seat.id} at index ${i}`);
            throw new Error(`Не найден ID билета для места: ${seat.label} (${i + 1}/${quantity})`);
          }

          // Проверяем что это валидный UUID
          const uuidRegex=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(ticketId)) {
            console.error('❌ Invalid UUID format for ticket ID:',ticketId);
            throw new Error(`Неверный формат ID билета: ${ticketId}`);
          }

          console.log(`✅ Using valid ticket ID (${i + 1}/${quantity}):`,ticketId);

          // КРИТИЧНО: Проверяем что билет еще не используется в других order_items
          const {data: existingOrderItem,error: checkError}=await supabase
            .from('order_items')
            .select('id')
            .eq('ticket_id',ticketId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = no rows found, это нормально
            throw checkError;
          }

          if (existingOrderItem) {
            console.error(`❌ Ticket ${ticketId} is already used in another order`);
            throw new Error(`Билет ${ticketId} уже используется в другом заказе`);
          }

          // Создаем элемент заказа с УНИКАЛЬНЫМ ticket ID
          const {data: orderItem,error: orderItemError}=await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              ticket_id: ticketId,// Используем УНИКАЛЬНЫЙ ticket ID
              unit_price: unitPrice,
              currency: 'EUR',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (orderItemError) {
            console.error('❌ Error creating order item:',orderItemError);
            throw orderItemError;
          }

          console.log(`✅ Created order item (${i + 1}/${quantity}):`,orderItem);

          // Обновляем статус билета на "sold" и связываем с order item
          const {error: ticketError}=await supabase
            .from('tickets')
            .update({
              status: 'sold',
              order_item_id: orderItem.id,
              updated_at: new Date().toISOString()
            })
            .eq('id',ticketId);

          if (ticketError) {
            console.error('❌ Error updating ticket status:',ticketError);
            throw ticketError;
          }

          console.log(`✅ Updated ticket status (${i + 1}/${quantity}) for:`,ticketId);
        }
      }

      console.log('🎉 Order creation completed successfully');
      return order;
    } catch (error) {
      console.error('❌ Error creating order:',error);
      throw error;
    }
  };

  const handleSubmit=async (e)=> {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Создаем заказ в базе данных и обновляем статусы билетов
        const order=await createOrder();

        // Store order summary in sessionStorage for thank you page
        const eventForSummary={
          ...eventDetails,
          image: eventDetails?.image || null,
          note: eventDetails?.note || ''
        };
        if (!eventDetails?.image) console.warn('Missing event.image when building order summary');
        if (!eventDetails?.note) console.warn('Missing event.note when building order summary');
        sessionStorage.setItem('orderSummary',JSON.stringify({
          seats: selectedSeats.map(seat=> ({
            ...seat,
            section: seat.section,
            row_number: seat.row_number,
            seat_number: seat.seat_number
          })),
          event: eventForSummary,
          totalPrice: calculateTotal(),
          orderNumber: `TW-${order.id.substring(0,6)}`,
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          }
        }));

        navigate('/thank-you');
      } catch (error) {
        console.error('Error processing order:',error);
        alert('Произошла ошибка при обработке заказа. Пожалуйста,попробуйте еще раз.');
        setIsSubmitting(false);
      }
    }
  };

  // Обработчик для Apple Pay
  const handleApplePayment=async ()=> {
    // Проверяем форму перед обработкой Apple Pay
    if (!validateForm()) {
      alert('Пожалуйста,заполните все обязательные поля перед оплатой через Apple Pay.');
      return;
    }

    setIsSubmitting(true);

    // Имитируем процесс оплаты через Apple Pay
    setTimeout(async ()=> {
      try {
        // Создаем заказ в базе данных и обновляем статусы билетов
        const order=await createOrder();

        // Store order summary in sessionStorage for thank you page
        const eventForSummary={
          ...eventDetails,
          image: eventDetails?.image || null,
          note: eventDetails?.note || ''
        };
        if (!eventDetails?.image) console.warn('Missing event.image when building order summary');
        if (!eventDetails?.note) console.warn('Missing event.note when building order summary');
        sessionStorage.setItem('orderSummary',JSON.stringify({
          seats: selectedSeats.map(seat=> ({
            ...seat,
            section: seat.section,
            row_number: seat.row_number,
            seat_number: seat.seat_number
          })),
          event: eventForSummary,
          totalPrice: calculateTotal(),
          orderNumber: `TW-${order.id.substring(0,6)}`,
          paymentMethod: 'Apple Pay',
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          }
        }));

        navigate('/thank-you');
      } catch (error) {
        console.error('Error processing Apple Pay order:',error);
        alert('Произошла ошибка при обработке заказа через Apple Pay. Пожалуйста,попробуйте еще раз.');
        setIsSubmitting(false);
      }
    },1500);
  };

  // Calculate subtotal
  const calculateSubtotal=()=> {
    return selectedSeats.reduce((sum,seat)=> sum + (parseFloat(seat.price) || 0),0);
  };

  // Calculate service fee (5% of subtotal)
  const calculateServiceFee=()=> {
    return calculateSubtotal() * 0.05;
  };

  // Calculate total
  const calculateTotal=()=> {
    return calculateSubtotal() + calculateServiceFee();
  };

  // Format date for display
  const formatDate=(dateString)=> {
    if (!dateString) return '';
    try {
      const options={day: 'numeric',month: 'long',year: 'numeric'};
      return new Date(dateString).toLocaleDateString('ru-RU',options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto max-w-[960px] px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.form
            initial={{opacity: 0,y: 20}}
            animate={{opacity: 1,y: 0}}
            transition={{duration: 0.5}}
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
                      placeholder="Введите ваше имя"
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
                      placeholder="Введите вашу фамилию"
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
                      placeholder="your@email.com"
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
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Выбор способа оплаты */}
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Способ оплаты</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  type="button"
                  onClick={()=> setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 ${
                    paymentMethod==='card'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  <SafeIcon icon={FiCreditCard} className="text-xl" />
                  <span>Банковская карта</span>
                </button>

                {isApplePayAvailable && (
                  <button
                    type="button"
                    onClick={()=> setPaymentMethod('applepay')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 ${
                      paymentMethod==='applepay'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-xl">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M17.6 12.9c-.1-1 .3-2.1.9-2.8.7-.7 1.8-1.1 2.8-1.2-.3-.9-1-1.7-1.8-2.1-.8-.5-1.8-.7-2.8-.5-.9.2-1.6.7-2.1.7-.5 0-1.3-.5-2.1-.5-1.1 0-2.1.6-2.7 1.5-1.2 1.9-.3 4.6.8 6.1.5.8 1.2 1.6 2 1.6s1.1-.5 2.1-.5 1.3.5 2.1.5c.9 0 1.5-.8 2-1.5.4-.6.7-1.2.8-1.9-1-.1-1.9-.5-2.5-1.2-.5-.7-.8-1.4-.7-2.2M15.5 8.7c.7-.9 1.1-2 .9-3.1-1 .1-1.9.5-2.5 1.3-.7.7-1 1.8-.9 2.8 1 0 1.9-.3 2.5-1"/>
                      </svg>
                    </span>
                    <span>Apple Pay</span>
                  </button>
                )}
              </div>

              {/* Данные карты (показываются только если выбрана оплата картой) */}
              {paymentMethod==='card' && (
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
                          placeholder="123"
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
              )}
            </div>

            {/* Кнопки оплаты */}
            {paymentMethod==='card' ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium ${
                  isSubmitting
                    ? 'bg-zinc-700 text-zinc-400'
                    : 'bg-yellow-500 text-black hover:bg-yellow-400'
                } transition`}
              >
                {isSubmitting ? 'Обработка...' : 'Оплатить картой'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplePayment}
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium ${
                  isSubmitting
                    ? 'bg-zinc-700 text-zinc-400'
                    : 'bg-black text-white hover:bg-zinc-900'
                } transition flex items-center justify-center gap-2`}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.6 12.9c-.1-1 .3-2.1.9-2.8.7-.7 1.8-1.1 2.8-1.2-.3-.9-1-1.7-1.8-2.1-.8-.5-1.8-.7-2.8-.5-.9.2-1.6.7-2.1.7-.5 0-1.3-.5-2.1-.5-1.1 0-2.1.6-2.7 1.5-1.2 1.9-.3 4.6.8 6.1.5.8 1.2 1.6 2 1.6s1.1-.5 2.1-.5 1.3.5 2.1.5c.9 0 1.5-.8 2-1.5.4-.6.7-1.2.8-1.9-1-.1-1.9-.5-2.5-1.2-.5-.7-.8-1.4-.7-2.2M15.5 8.7c.7-.9 1.1-2 .9-3.1-1 .1-1.9.5-2.5 1.3-.7.7-1 1.8-.9 2.8 1 0 1.9-.3 2.5-1"/>
                </svg>
                {isSubmitting ? 'Обработка...' : 'Оплатить через Apple Pay'}
              </button>
            )}
          </motion.form>
        </div>

        <div>
          <div className="bg-zinc-800 p-6 rounded-lg sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Ваш заказ</h2>

            <div className="space-y-4 mb-6">
              {/* Event details */}
              {eventDetails && (
                <div className="border-b border-zinc-700 pb-3 mb-3">
                  <h3 className="font-medium">{eventDetails.title}</h3>
                  <p className="text-sm text-zinc-400">{formatDate(eventDetails.date)}</p>
                  <p className="text-sm text-zinc-400">{eventDetails.location}</p>
                  {eventDetails.venue && (
                    <p className="text-sm text-zinc-400">{eventDetails.venue}</p>
                  )}
                </div>
              )}

              {/* Selected seats */}
              {selectedSeats.map((seat)=> (
                <div key={seat.id} className="flex justify-between">
                  <span className="text-zinc-400">
                    {seat.number || seat.label || `Место ${seat.id.substring(0,4)}`}
                    {seat.quantity > 1 && ` (${seat.quantity} мест)`}
                  </span>
                  <span>{formatPrice(seat.price)} €</span>
                </div>
              ))}

              {/* Service fee */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Сервисный сбор</span>
                <span>{formatPrice(calculateServiceFee())} €</span>
              </div>

              {/* Total */}
              <div className="border-t border-zinc-700 pt-4 flex justify-between font-bold">
                <span>Итого</span>
                <span>{formatPrice(calculateTotal())} €</span>
              </div>
            </div>

            <div className="text-xs text-zinc-400">
              <p className="mb-2">
                Нажимая "Оплатить",вы соглашаетесь с условиями покупки и политикой конфиденциальности.
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