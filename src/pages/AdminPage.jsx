import React,{useState,useEffect} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import {fetchEvents,deleteEvent} from '../services/eventService';
import EventWizard from '../components/events/EventWizard';
import VenueDesigner from '../components/venue/VenueDesigner';
import supabase from '../lib/supabase';

const {FiUsers,FiCalendar,FiDollarSign,FiTrendingUp,FiChevronRight,FiChevronLeft,FiPlus,FiEdit2,FiTrash2,FiSettings,FiMapPin,FiLoader,FiShoppingBag,FiCheck,FiX,FiRefreshCw,FiDownload,FiEye}=FiIcons;

const AdminPage=()=> {
  const navigate=useNavigate();
  const [activeTab,setActiveTab]=useState('dashboard');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showEventWizard,setShowEventWizard]=useState(false);
  const [selectedEvent,setSelectedEvent]=useState(null);
  const [deleting,setDeleting]=useState(null);

  // Venues state
  const [venues,setVenues]=useState([]);
  const [venuesLoading,setVenuesLoading]=useState(true);
  const [venuesError,setVenuesError]=useState(null);
  const [showVenueDesigner,setShowVenueDesigner]=useState(false);
  const [currentVenue,setCurrentVenue]=useState(null);
  const [savingVenue,setSavingVenue]=useState(false);

  // Orders state
  const [orders,setOrders]=useState([]);
  const [ordersLoading,setOrdersLoading]=useState(true);
  const [ordersError,setOrdersError]=useState(null);
  const [orderDetails,setOrderDetails]=useState(null);
  const [showOrderDetails,setShowOrderDetails]=useState(false);
  const [processingOrderAction,setProcessingOrderAction]=useState(false);

  // Моковые данные для админки
  const stats={
    users: 1245,
    events: events.length,
    revenue: 15680,
    growth: 24.5,
  };

  // Fetch events
  useEffect(()=> {
    loadEvents();
  },[]);

  // Fetch venues when venues tab is active
  useEffect(()=> {
    if (activeTab==='venues') {
      fetchVenues();
    } else if (activeTab==='orders') {
      fetchOrders();
    }
  },[activeTab]);

  const loadEvents=async ()=> {
    try {
      setLoading(true);
      const eventsData=await fetchEvents();
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:',error);
    } finally {
      setLoading(false);
    }
  };

  // Venues functions
  const fetchVenues=async ()=> {
    try {
      setVenuesLoading(true);
      setVenuesError(null);

      const {data,error}=await supabase
        .from('venues')
        .select('*')
        .order('created_at',{ascending: false});

      if (error) throw error;

      setVenues(data || []);
    } catch (err) {
      console.error('Error fetching venues:',err);
      setVenuesError('Failed to load venues. Please try again.');
    } finally {
      setVenuesLoading(false);
    }
  };

  // ИСПРАВЛЕННАЯ функция Orders с упрощенным запросом
  const fetchOrders=async ()=> {
    try {
      setOrdersLoading(true);
      setOrdersError(null);

      // ИСПРАВЛЕННЫЙ подход: сначала получаем базовые заказы
      const {data: ordersData,error: ordersError}=await supabase
        .from('orders')
        .select('*')
        .order('created_at',{ascending: false});

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        console.log('No orders found');
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      // Затем получаем данные пользователей
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];
      let usersMap = {};
      
      if (userIds.length > 0) {
        const {data: usersData, error: usersError} = await supabase
          .from('user_meta')
          .select('*')
          .in('id', userIds);
          
        if (usersError) {
          console.warn('Error fetching users:', usersError);
        } else {
          usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      // Получаем order_items для всех заказов
      const orderIds = ordersData.map(order => order.id);
      const {data: orderItemsData, error: orderItemsError} = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (orderItemsError) {
        console.warn('Error fetching order items:', orderItemsError);
      }

      // Группируем order_items по order_id
      const orderItemsMap = {};
      if (orderItemsData) {
        orderItemsData.forEach(item => {
          if (!orderItemsMap[item.order_id]) {
            orderItemsMap[item.order_id] = [];
          }
          orderItemsMap[item.order_id].push(item);
        });
      }

      // Получаем данные билетов если есть order_items
      const ticketIds = orderItemsData ? orderItemsData.map(item => item.ticket_id).filter(Boolean) : [];
      let ticketsMap = {};
      
      if (ticketIds.length > 0) {
        const {data: ticketsData, error: ticketsError} = await supabase
          .from('tickets')
          .select(`
            *,
            event:events(id, title, event_date),
            zone:zones(id, name),
            seat:single_seats(id, row_number, seat_number, section)
          `)
          .in('id', ticketIds);
          
        if (ticketsError) {
          console.warn('Error fetching tickets:', ticketsError);
        } else {
          ticketsMap = ticketsData.reduce((acc, ticket) => {
            acc[ticket.id] = ticket;
            return acc;
          }, {});
        }
      }

      // Собираем все данные вместе
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        user_meta: usersMap[order.user_id] || null,
        order_items: (orderItemsMap[order.id] || []).map(item => ({
          ...item,
          ticket: ticketsMap[item.ticket_id] || null
        }))
      }));

      console.log('✅ Orders loaded successfully:', enrichedOrders.length);
      setOrders(enrichedOrders);
    } catch (err) {
      console.error('Error fetching orders:',err);
      setOrdersError('Failed to load orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const viewOrderDetails=(order)=> {
    setOrderDetails(order);
    setShowOrderDetails(true);
  };

  const handleOrderAction=async (action,orderId,ticketIds=[])=> {
    setProcessingOrderAction(true);
    try {
      if (action==='refund') {
        // Обновляем статус заказа на "refunded"
        const {error: orderError}=await supabase
          .from('orders')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('id',orderId);

        if (orderError) throw orderError;

        // Обновляем статус всех билетов на "free"
        const {error: ticketsError}=await supabase
          .from('tickets')
          .update({
            status: 'free',
            order_item_id: null,
            updated_at: new Date().toISOString()
          })
          .in('id',ticketIds);

        if (ticketsError) throw ticketsError;

        // Обновляем список заказов
        fetchOrders();

        // Закрываем модальное окно деталей заказа
        setShowOrderDetails(false);
      } else if (action==='cancel') {
        // Отменяем заказ (удаляем его)
        const {error: orderError}=await supabase
          .from('orders')
          .delete()
          .eq('id',orderId);

        if (orderError) throw orderError;

        // Обновляем статус всех билетов на "free"
        const {error: ticketsError}=await supabase
          .from('tickets')
          .update({
            status: 'free',
            order_item_id: null,
            updated_at: new Date().toISOString()
          })
          .in('id',ticketIds);

        if (ticketsError) throw ticketsError;

        // Обновляем список заказов
        fetchOrders();

        // Закрываем модальное окно деталей заказа
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('Error processing order action:',error);
      alert('Произошла ошибка при обработке действия. Пожалуйста,попробуйте еще раз.');
    } finally {
      setProcessingOrderAction(false);
    }
  };

  const handleCreateVenue=()=> {
    setCurrentVenue(null);
    setShowVenueDesigner(true);
  };

  const handleEditVenue=(venue)=> {
    setCurrentVenue(venue);
    setShowVenueDesigner(true);
  };

  const handleDeleteVenue=async (venueId)=> {
    if (!window.confirm('Вы уверены,что хотите удалить это место? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setVenuesLoading(true);

      // Check if venue is used in any events
      const {data: events,error: eventsError}=await supabase
        .from('events')
        .select('id')
        .eq('venue_id',venueId)
        .limit(1);

      if (eventsError) throw eventsError;

      if (events && events.length > 0) {
        alert('Это место нельзя удалить,так как оно используется в существующих событиях.');
        return;
      }

      // Delete associated zones
      const {error: zonesError}=await supabase
        .from('zones')
        .delete()
        .eq('venue_id',venueId);

      if (zonesError) throw zonesError;

      // Delete associated single seats
      const {error: seatsError}=await supabase
        .from('single_seats')
        .delete()
        .eq('venue_id',venueId);

      if (seatsError) throw seatsError;

      // Delete venue
      const {error: venueError}=await supabase
        .from('venues')
        .delete()
        .eq('id',venueId);

      if (venueError) throw venueError;

      // Update state
      setVenues(venues.filter(venue=> venue.id !==venueId));
      alert('Место успешно удалено!');
    } catch (err) {
      console.error('Error deleting venue:',err);
      alert('Не удалось удалить место. Попробуйте еще раз.');
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleSaveVenue=async (venueData,venueId=null)=> {
    try {
      setSavingVenue(true);

      // Parse categories and elements from canvas data
      const categories=venueData.canvas_data?.categories || {};
      const elements=venueData.canvas_data?.elements || [];

      // Create or update venue record
      let savedVenue;
      if (venueId) {
        // Update existing venue
        const {data,error}=await supabase
          .from('venues')
          .update({
            name: venueData.name,
            address: venueData.address || '',
            geometry_data: JSON.stringify(venueData.canvas_data),
            updated_at: new Date().toISOString()
          })
          .eq('id',venueId)
          .select()
          .single();

        if (error) throw error;
        savedVenue=data;
      } else {
        // Create new venue
        const {data,error}=await supabase
          .from('venues')
          .insert({
            name: venueData.name,
            address: venueData.address || '',
            geometry_data: JSON.stringify(venueData.canvas_data),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        savedVenue=data;
      }

      // Save seat categories
      for (const [categoryId,categoryData] of Object.entries(categories)) {
        // Check if category exists
        const {data: existingCategories,error: categoryCheckError}=await supabase
          .from('seat_categories')
          .select('id')
          .eq('name',categoryId)
          .limit(1);

        if (categoryCheckError) throw categoryCheckError;

        if (!existingCategories || existingCategories.length===0) {
          // Create new category
          const {error: categoryError}=await supabase
            .from('seat_categories')
            .insert({
              name: categoryId,
              color: categoryData.color,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (categoryError) throw categoryError;
        }
      }

      // Delete existing zones and seats for this venue if updating
      if (venueId) {
        // Delete zones
        const {error: zonesDeleteError}=await supabase
          .from('zones')
          .delete()
          .eq('venue_id',venueId);

        if (zonesDeleteError) throw zonesDeleteError;

        // Delete seats
        const {error: seatsDeleteError}=await supabase
          .from('single_seats')
          .delete()
          .eq('venue_id',venueId);

        if (seatsDeleteError) throw seatsDeleteError;
      }

      // Save zones and seats
      const zoneElements=elements.filter(el=> el.type==='section' || el.type==='polygon');
      const seatElements=elements.filter(el=> el.type==='seat');

      // Save zones first
      for (const zone of zoneElements) {
        let categoryId=null;
        if (zone.categoryId) {
          // Lookup category ID
          const {data: categoryData,error: categoryError}=await supabase
            .from('seat_categories')
            .select('id')
            .eq('name',zone.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId=categoryData[0].id;
          }
        }

        // Create zone record
        const {data: zoneData,error: zoneError}=await supabase
          .from('zones')
          .insert({
            venue_id: savedVenue.id,
            category_id: categoryId,
            name: zone.label || `Zone ${zone.id}`,
            capacity: zone.capacity || 1,
            ui_shape: JSON.stringify({
              type: zone.type,
              x: zone.x,
              y: zone.y,
              width: zone.width,
              height: zone.height,
              points: zone.points,
              is_bookable: zone.is_bookable !==false
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (zoneError) throw zoneError;
      }

      // Save single seats
      for (const seat of seatElements) {
        let categoryId=null;
        if (seat.categoryId) {
          // Lookup category ID
          const {data: categoryData,error: categoryError}=await supabase
            .from('seat_categories')
            .select('id')
            .eq('name',seat.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId=categoryData[0].id;
          }
        }

        // Find zone that contains this seat (if any)
        let zoneId=null;

        // Create seat record
        const {error: seatError}=await supabase
          .from('single_seats')
          .insert({
            venue_id: savedVenue.id,
            zone_id: zoneId,
            category_id: categoryId,
            row_number: seat.row || 1,
            seat_number: seat.seat || 1,
            section: seat.section || 'A',
            x: seat.x,
            y: seat.y,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (seatError) throw seatError;
      }

      // Update state
      if (venueId) {
        setVenues(venues.map(v=> v.id===venueId ? {...v,...savedVenue} : v));
      } else {
        setVenues([savedVenue,...venues]);
      }

      // Close designer
      setShowVenueDesigner(false);
      setCurrentVenue(null);
      alert(`Место ${venueId ? 'обновлено' : 'создано'} успешно!`);
    } catch (err) {
      console.error('Error saving venue:',err);
      alert('Не удалось сохранить место. Попробуйте еще раз.');
    } finally {
      setSavingVenue(false);
    }
  };

  const handleCreateEvent=()=> {
    setSelectedEvent(null);
    setShowEventWizard(true);
  };

  const handleEditEvent=(event)=> {
    console.log("Original event data:",event);

    // Правильно форматируем данные события для EventWizard
    const formattedEvent={
      ...event,
      // Убеждаемся,что дата в правильном формате для datetime-local
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0,16) : new Date().toISOString().slice(0,16),
      // Убеждаемся,что все поля существуют
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'concert',
      artist: event.artist || '',
      genre: event.genre || '',
      location: event.location || '',
      image: event.image || 'https://placehold.co/600x400/333/FFF?text=Event',
      venue_id: event.venue_id || null,
      prices: {} // Prices будут загружены в EventWizard через loadEventData
    };

    console.log("Formatted event for editing:",formattedEvent);
    setSelectedEvent(formattedEvent);
    setShowEventWizard(true);
  };

  const handleDeleteEvent=async (eventId)=> {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        setDeleting(eventId);
        await deleteEvent(eventId);
        // Remove event from local state
        setEvents(events.filter(event=> event.id !==eventId));
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:',error);
        alert('Failed to delete event. Please try again.');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleEventWizardClose=()=> {
    setShowEventWizard(false);
    setSelectedEvent(null);
  };

  const handleEventSaved=(savedEvent)=> {
    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(event=> event.id===selectedEvent.id ? {...event,...savedEvent} : event));
    } else {
      // Add new event
      setEvents([savedEvent,...events]);
    }
  };

  const menuItems=[
    {id: 'dashboard',label: 'Дашборд',icon: FiTrendingUp},
    {id: 'events',label: 'События',icon: FiCalendar},
    {id: 'venues',label: 'Места',icon: FiMapPin},
    {id: 'orders',label: 'Заказы',icon: FiShoppingBag},
    {id: 'users',label: 'Пользователи',icon: FiUsers},
    {id: 'settings',label: 'Настройки',icon: FiSettings},
  ];

  const Sidebar=({className=''})=> (
    <div className={`bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 h-full ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Админ-панель</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item)=> (
              <li key={item.id}>
                <button
                  onClick={()=> {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                    activeTab===item.id
                      ? 'bg-yellow-500 text-black'
                      : 'text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <SafeIcon icon={item.icon} className="text-lg" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );

  // Format date for display
  const formatDate=(dateString)=> {
    if (!dateString) return 'N/A';
    const date=new Date(dateString);
    return date.toLocaleDateString('ru-RU',{
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime=(dateString)=> {
    if (!dateString) return 'N/A';
    const date=new Date(dateString);
    return date.toLocaleString('ru-RU',{
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price with proper decimal places
  const formatPrice=(price)=> {
    return price ? Number(price).toFixed(2) : '0.00';
  };

  // Get status label and color
  const getOrderStatusInfo=(status)=> {
    switch (status) {
      case 'pending':
        return {label: 'Ожидает оплаты',color: 'bg-yellow-500'};
      case 'paid':
        return {label: 'Оплачен',color: 'bg-green-500'};
      case 'refunded':
        return {label: 'Возвращен',color: 'bg-red-500'};
      default:
        return {label: status,color: 'bg-gray-500'};
    }
  };

  // Получение названия события из первого билета заказа
  const getEventTitle = (order) => {
    if (order.order_items && order.order_items.length > 0) {
      const firstItem = order.order_items[0];
      if (firstItem.ticket && firstItem.ticket.event) {
        return firstItem.ticket.event.title || 'Неизвестное событие';
      }
    }
    return 'Неизвестное событие';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex pt-11">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed h-[calc(100vh-44px)] top-11">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={()=> setSidebarOpen(false)}
            />
            <motion.div
              initial={{x: '-100%'}}
              animate={{x: 0}}
              exit={{x: '-100%'}}
              transition={{type: 'tween',duration: 0.3}}
              className="fixed left-0 top-11 h-[calc(100vh-44px)] w-64 z-50 lg:hidden"
            >
              <Sidebar />
              <button
                onClick={()=> setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                <SafeIcon icon={FiChevronLeft} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <button
              onClick={()=> setSidebarOpen(true)}
              className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
            >
              <SafeIcon icon={FiChevronRight} />
            </button>
            <h1 className="text-2xl font-bold ml-2">
              {menuItems.find((item)=> item.id===activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold">
              {menuItems.find((item)=> item.id===activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Content */}
          {activeTab==='dashboard' && (
            <motion.div
              initial={{opacity: 0,y: 20}}
              animate={{opacity: 1,y: 0}}
              transition={{duration: 0.5}}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-600 dark:text-zinc-400">Пользователи</h3>
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <SafeIcon icon={FiUsers} className="text-blue-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stats.users}</p>
                  <p className="text-xs text-green-500">+12% с прошлого месяца</p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-600 dark:text-zinc-400">События</h3>
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <SafeIcon icon={FiCalendar} className="text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stats.events}</p>
                  <p className="text-xs text-green-500">+5 новых за неделю</p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-600 dark:text-zinc-400">Доход</h3>
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <SafeIcon icon={FiDollarSign} className="text-green-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stats.revenue} €</p>
                  <p className="text-xs text-green-500">+18% с прошлого месяца</p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-600 dark:text-zinc-400">Рост</h3>
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <SafeIcon icon={FiTrendingUp} className="text-purple-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stats.growth}%</p>
                  <p className="text-xs text-green-500">+5.4% с прошлого месяца</p>
                </div>
              </div>

              {/* Events Table */}
              <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Последние события</h3>
                  <button
                    onClick={handleCreateEvent}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center"
                  >
                    <SafeIcon icon={FiPlus} className="mr-2" />
                    Создать событие
                  </button>
                </div>

                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_,i)=> (
                      <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zinc-600 dark:text-zinc-400 text-sm">
                          <th className="pb-3">Название</th>
                          <th className="pb-3 hidden md:table-cell">Дата</th>
                          <th className="pb-3 hidden sm:table-cell">Место</th>
                          <th className="pb-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event)=> (
                          <tr key={event.id} className="border-t border-zinc-200 dark:border-zinc-700">
                            <td className="py-3">{event.title}</td>
                            <td className="py-3 hidden md:table-cell">{formatDate(event.event_date)}</td>
                            <td className="py-3 hidden sm:table-cell">{event.location}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={()=> handleEditEvent(event)}
                                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                                title="Edit"
                              >
                                <SafeIcon icon={FiEdit2} />
                              </button>
                              <button
                                onClick={()=> handleDeleteEvent(event.id)}
                                disabled={deleting===event.id}
                                className="p-2 text-red-500 hover:text-red-700 transition disabled:opacity-50"
                                title="Delete"
                              >
                                <SafeIcon icon={FiTrash2} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <p>Нет доступных событий</p>
                    <button
                      onClick={handleCreateEvent}
                      className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                    >
                      Создать первое событие
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab==='events' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Управление событиями</h3>
                <button
                  onClick={handleCreateEvent}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center"
                >
                  <SafeIcon icon={FiPlus} className="mr-2" />
                  Создать событие
                </button>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_,i)=> (
                    <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-zinc-600 dark:text-zinc-400 text-sm">
                        <th className="pb-3">Название</th>
                        <th className="pb-3">Дата</th>
                        <th className="pb-3 hidden md:table-cell">Категория</th>
                        <th className="pb-3">Место</th>
                        <th className="pb-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event)=> (
                        <tr key={event.id} className="border-t border-zinc-200 dark:border-zinc-700">
                          <td className="py-3">{event.title}</td>
                          <td className="py-3">{formatDate(event.event_date)}</td>
                          <td className="py-3 hidden md:table-cell capitalize">{event.category}</td>
                          <td className="py-3">{event.location}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={()=> handleEditEvent(event)}
                              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                              title="Edit"
                            >
                              <SafeIcon icon={FiEdit2} />
                            </button>
                            <button
                              onClick={()=> handleDeleteEvent(event.id)}
                              disabled={deleting===event.id}
                              className="p-2 text-red-500 hover:text-red-700 transition disabled:opacity-50"
                              title="Delete"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <p>Нет доступных событий</p>
                  <button
                    onClick={handleCreateEvent}
                    className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                  >
                    Создать первое событие
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Venues Tab Content */}
          {activeTab==='venues' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Управление местами проведения</h3>
                <button
                  onClick={handleCreateVenue}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center"
                >
                  <SafeIcon icon={FiPlus} className="mr-2" />
                  Создать место
                </button>
              </div>

              {venuesError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                  {venuesError}
                </div>
              )}

              {venuesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_,i)=> (
                    <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  ))}
                </div>
              ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venues.map(venue=> (
                    <motion.div
                      key={venue.id}
                      initial={{opacity: 0,y: 20}}
                      animate={{opacity: 1,y: 0}}
                      className="bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm"
                    >
                      <div className="h-32 bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center">
                        <div className="text-5xl text-white opacity-80">🏟️</div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                          {venue.name || 'Без названия'}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {venue.address || 'Адрес не указан'}
                        </p>
                        <div className="mt-4 flex justify-end space-x-2">
                          <button
                            onClick={()=> handleEditVenue(venue)}
                            className="p-2 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                            title="Редактировать"
                          >
                            <SafeIcon icon={FiEdit2} />
                          </button>
                          <button
                            onClick={()=> handleDeleteVenue(venue.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                            title="Удалить"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 text-center">
                  <h2 className="text-xl font-medium mb-2 text-zinc-900 dark:text-white">Пока нет мест</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Создайте первое место для начала управления событиями и рассадкой.
                  </p>
                  <button
                    onClick={handleCreateVenue}
                    className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                  >
                    Создать первое место
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab Content */}
          {activeTab==='orders' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Управление заказами</h3>
                <button
                  onClick={()=> fetchOrders()}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition flex items-center"
                >
                  <SafeIcon icon={FiRefreshCw} className="mr-2" />
                  Обновить
                </button>
              </div>

              {ordersError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                  {ordersError}
                </div>
              )}

              {ordersLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_,i)=> (
                    <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-zinc-600 dark:text-zinc-400 text-sm">
                        <th className="pb-3">ID заказа</th>
                        <th className="pb-3">Дата</th>
                        <th className="pb-3">Клиент</th>
                        <th className="pb-3">Событие</th>
                        <th className="pb-3">Сумма</th>
                        <th className="pb-3">Статус</th>
                        <th className="pb-3">Билетов</th>
                        <th className="pb-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order)=> {
                        const statusInfo=getOrderStatusInfo(order.status);
                        const ticketCount=order.order_items?.length || 0;
                        return (
                          <tr key={order.id} className="border-t border-zinc-200 dark:border-zinc-700">
                            <td className="py-3">{order.id.substring(0,8)}...</td>
                            <td className="py-3">{formatDate(order.created_at)}</td>
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="text-zinc-900 dark:text-white">
                                  {order.user_meta ? `${order.user_meta.first_name || ''} ${order.user_meta.last_name || ''}`.trim() : 'Неизвестно'}
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {order.user_meta?.email || ''}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              {getEventTitle(order)}
                            </td>
                            <td className="py-3">{formatPrice(order.total_price)} €</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="py-3">{ticketCount}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={()=> viewOrderDetails(order)}
                                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                                title="Просмотреть детали"
                              >
                                <SafeIcon icon={FiEye} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <p>Нет доступных заказов</p>
                </div>
              )}
            </div>
          )}

          {(activeTab !=='dashboard' && activeTab !=='events' && activeTab !=='venues' && activeTab !=='orders') && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-8 rounded-lg text-center">
              <h2 className="text-xl font-medium mb-2">Раздел в разработке</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Этот раздел панели администратора находится в процессе разработки.
              </p>
              <button
                onClick={()=> setActiveTab('dashboard')}
                className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                Вернуться к дашборду
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Wizard Modal */}
      {showEventWizard && (
        <EventWizard
          eventToEdit={selectedEvent}
          onCancel={handleEventWizardClose}
          onEventSaved={handleEventSaved}
        />
      )}

      {/* Venue Designer Modal */}
      {showVenueDesigner && (
        <VenueDesigner
          venue={currentVenue}
          onSave={handleSaveVenue}
          onCancel={()=> setShowVenueDesigner(false)}
          saving={savingVenue}
        />
      )}

      {/* Order Details Modal */}
      {showOrderDetails && orderDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{opacity: 0,scale: 0.95}}
            animate={{opacity: 1,scale: 1}}
            exit={{opacity: 0,scale: 0.95}}
            className="w-full max-w-3xl bg-zinc-900 rounded-lg shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
              <h2 className="text-xl font-semibold text-white">
                Заказ #{orderDetails.id.substring(0,8)}
              </h2>
              <button
                onClick={()=> setShowOrderDetails(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Info */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-1">Информация о заказе</h3>
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <div className="mb-2">
                      <span className="text-zinc-400 text-sm">ID:</span>
                      <span className="text-white ml-2 font-mono">{orderDetails.id}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-zinc-400 text-sm">Дата создания:</span>
                      <span className="text-white ml-2">{formatDateTime(orderDetails.created_at)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-zinc-400 text-sm">Последнее обновление:</span>
                      <span className="text-white ml-2">{formatDateTime(orderDetails.updated_at)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-zinc-400 text-sm">Статус:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full text-white ${getOrderStatusInfo(orderDetails.status).color}`}>
                        {getOrderStatusInfo(orderDetails.status).label}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-sm">Сумма заказа:</span>
                      <span className="text-white ml-2 font-bold">{formatPrice(orderDetails.total_price)} €</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-1">Действия</h3>
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <div className="flex flex-col gap-3">
                      {orderDetails.status==='paid' && (
                        <>
                          <button
                            onClick={()=> {
                              const ticketIds=orderDetails.order_items.map(item=> item.ticket?.id).filter(Boolean);
                              handleOrderAction('refund',orderDetails.id,ticketIds);
                            }}
                            disabled={processingOrderAction}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                          >
                            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                            {processingOrderAction ? 'Обработка...' : 'Вернуть деньги'}
                          </button>
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          >
                            <SafeIcon icon={FiDownload} className="w-4 h-4" />
                            Скачать билеты
                          </button>
                        </>
                      )}

                      {orderDetails.status==='pending' && (
                        <button
                          onClick={()=> {
                            const ticketIds=orderDetails.order_items.map(item=> item.ticket?.id).filter(Boolean);
                            handleOrderAction('cancel',orderDetails.id,ticketIds);
                          }}
                          disabled={processingOrderAction}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <SafeIcon icon={FiX} className="w-4 h-4" />
                          {processingOrderAction ? 'Обработка...' : 'Отменить заказ'}
                        </button>
                      )}

                      {orderDetails.status==='refunded' && (
                        <div className="text-center text-zinc-400 py-2">
                          Заказ возвращен. Никаких действий не требуется.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Билеты в заказе</h3>
              <div className="bg-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-zinc-300 text-sm">Событие</th>
                      <th className="text-left py-3 px-4 text-zinc-300 text-sm">Место</th>
                      <th className="text-left py-3 px-4 text-zinc-300 text-sm">Цена</th>
                      <th className="text-left py-3 px-4 text-zinc-300 text-sm">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {orderDetails.order_items.map((item)=> {
                      const ticket=item.ticket;
                      const eventTitle=ticket?.event?.title || 'Нет данных';
                      const eventDate=ticket?.event?.event_date ? formatDate(ticket.event.event_date) : 'Нет даты';

                      // Определяем информацию о месте
                      let seatInfo='Общий вход';
                      if (ticket?.seat) {
                        seatInfo=`${ticket.seat.section} ряд ${ticket.seat.row_number} место ${ticket.seat.seat_number}`;
                      } else if (ticket?.zone) {
                        seatInfo=`Зона "${ticket.zone.name}"`;
                      }

                      return (
                        <tr key={item.id} className="hover:bg-zinc-700/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{eventTitle}</div>
                            <div className="text-sm text-zinc-400">{eventDate}</div>
                          </td>
                          <td className="py-3 px-4 text-white">{seatInfo}</td>
                          <td className="py-3 px-4 text-white">{formatPrice(item.unit_price)} €</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full text-white ${
                              ticket?.status==='sold' ? 'bg-green-500' :
                              ticket?.status==='held' ? 'bg-yellow-500' : 'bg-zinc-500'
                            }`}>
                              {ticket?.status==='sold' ? 'Продан' :
                               ticket?.status==='held' ? 'Забронирован' : 'Свободен'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-700 flex justify-end">
              <button
                onClick={()=> setShowOrderDetails(false)}
                className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;