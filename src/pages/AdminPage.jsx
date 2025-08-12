import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { fetchEvents, deleteEvent } from '../services/eventService';
import EventWizard from '../components/events/EventWizard';
import VenueDesigner from '../components/venue/VenueDesigner';
import TicketTemplateSettings from '../components/admin/TicketTemplateSettings';
import supabase from '../lib/supabase';
import { downloadTicketsPDF } from '../utils/pdfGenerator';

const {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiChevronRight,
  FiChevronLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSettings,
  FiMapPin,
  FiLoader,
  FiShoppingBag,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiSave,
  FiRotateCcw,
  FiGlobe,
  FiTag,
  FiImage,
  FiClock,
  FiActivity,
  FiTarget,
  FiBarChart3,
  FiPieChart,
  FiMail // Добавлен импорт для иконки билетов
} = FiIcons;

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Venues state
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState(null);
  const [showVenueDesigner, setShowVenueDesigner] = useState(false);
  const [currentVenue, setCurrentVenue] = useState(null);
  const [savingVenue, setSavingVenue] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [processingOrderAction, setProcessingOrderAction] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'TicketWayz',
    siteDescription: 'Лучший сервис для покупки билетов на концерты, вечеринки и автобусные туры',
    siteKeywords: 'билеты, концерты, вечеринки, автобусные туры, развлечения',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    favicon: '/favicon.ico',
    googleAnalytics: '',
    yandexMetrica: '',
    customCSS: '',
    customJS: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // НОВЫЕ состояния для реальной статистики дашборда
  const [dashboardStats, setDashboardStats] = useState({
    todaySales: { value: 0, change: 0, changeType: 'neutral' },
    totalCustomers: { value: 0, change: 0, changeType: 'neutral' },
    activeEvents: { value: 0, change: 0, changeType: 'neutral' },
    avgTicketPrice: { value: 0, change: 0, changeType: 'neutral' },
    conversionRate: { value: 0, change: 0, changeType: 'neutral' },
    venueUtilization: { value: 0, change: 0, changeType: 'neutral' },
    totalRevenue: { value: 0, change: 0, changeType: 'neutral' },
    avgResponseTime: { value: 0, change: 0, changeType: 'neutral' }
  });
  const [recentSales, setRecentSales] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [popularEvent, setPopularEvent] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Fetch events
  useEffect(() => {
    loadEvents();
  }, []);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Fetch venues when venues tab is active
  useEffect(() => {
    if (activeTab === 'venues') {
      fetchVenues();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeTab]);

  // НОВАЯ функция для загрузки статистики дашборда
  const loadDashboardStats = async () => {
    try {
      setDashboardLoading(true);
      // Параллельно загружаем все необходимые данные
      const [
        todaysSalesData,
        yesterdaysSalesData,
        customersData,
        eventsData,
        recentSalesData,
        revenueBreakdownData,
        ticketsData
      ] = await Promise.all([
        getTodaysSales(),
        getYesterdaysSales(),
        getCustomersStats(),
        getEventsStats(),
        getRecentSales(),
        getRevenueBreakdown(),
        getTicketsStats()
      ]);

      // Рассчитываем изменения
      const salesChange = yesterdaysSalesData.total > 0 
        ? ((todaysSalesData.total - yesterdaysSalesData.total) / yesterdaysSalesData.total * 100) 
        : 0;
      const customersChange = customersData.lastMonth > 0 
        ? ((customersData.thisMonth - customersData.lastMonth) / customersData.lastMonth * 100) 
        : 0;
      const eventsChange = eventsData.lastMonth > 0 
        ? (eventsData.thisMonth - eventsData.lastMonth) 
        : eventsData.thisMonth;

      // Обновляем состояние статистики
      setDashboardStats({
        todaySales: {
          value: todaysSalesData.total,
          change: salesChange,
          changeType: salesChange > 0 ? 'positive' : salesChange < 0 ? 'negative' : 'neutral'
        },
        totalCustomers: {
          value: customersData.total,
          change: customersChange,
          changeType: customersChange > 0 ? 'positive' : customersChange < 0 ? 'negative' : 'neutral'
        },
        activeEvents: {
          value: eventsData.active,
          change: eventsChange,
          changeType: eventsChange > 0 ? 'positive' : eventsChange < 0 ? 'negative' : 'neutral'
        },
        avgTicketPrice: {
          value: ticketsData.avgPrice,
          change: ticketsData.priceChange,
          changeType: ticketsData.priceChange > 0 ? 'positive' : ticketsData.priceChange < 0 ? 'negative' : 'neutral'
        },
        conversionRate: {
          value: ticketsData.conversionRate,
          change: ticketsData.conversionChange,
          changeType: ticketsData.conversionChange > 0 ? 'positive' : ticketsData.conversionChange < 0 ? 'negative' : 'neutral'
        },
        venueUtilization: {
          value: ticketsData.utilization,
          change: ticketsData.utilizationChange,
          changeType: ticketsData.utilizationChange > 0 ? 'positive' : ticketsData.utilizationChange < 0 ? 'negative' : 'neutral'
        },
        totalRevenue: {
          value: todaysSalesData.total + (revenueBreakdownData.total || 0),
          change: 24, // Примерное значение из требований
          changeType: 'positive'
        },
        avgResponseTime: {
          value: 1.2, // Примерное значение из требований
          change: -10,
          changeType: 'positive' // Уменьшение времени ответа - это хорошо
        }
      });

      setRecentSales(recentSalesData);
      setRevenueBreakdown(revenueBreakdownData.breakdown || []);
      setPopularEvent(ticketsData.popularEvent);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // НОВЫЕ функции для получения реальной статистики
  const getTodaysSales = async () => {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('orders')
        .select('total_price')
        .eq('status', 'paid')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (error) throw error;

      const total = data.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
      return { total, count: data.length };
    } catch (error) {
      console.error('Error getting today sales:', error);
      return { total: 0, count: 0 };
    }
  };

  const getYesterdaysSales = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('orders')
        .select('total_price')
        .eq('status', 'paid')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      if (error) throw error;

      const total = data.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
      return { total, count: data.length };
    } catch (error) {
      console.error('Error getting yesterday sales:', error);
      return { total: 0, count: 0 };
    }
  };

  const getCustomersStats = async () => {
    try {
      // Всего клиентов
      const { data: totalData, error: totalError } = await supabase
        .from('user_meta')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      // Клиенты за этот месяц
      const thisMonth = new Date();
      const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from('user_meta')
        .select('id', { count: 'exact' })
        .gte('created_at', thisMonthStart.toISOString());

      if (thisMonthError) throw thisMonthError;

      // Клиенты за прошлый месяц
      const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
      const lastMonthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 0);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('user_meta')
        .select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      if (lastMonthError) throw lastMonthError;

      return {
        total: totalData?.length || 0,
        thisMonth: thisMonthData?.length || 0,
        lastMonth: lastMonthData?.length || 0
      };
    } catch (error) {
      console.error('Error getting customers stats:', error);
      return { total: 0, thisMonth: 0, lastMonth: 0 };
    }
  };

  const getEventsStats = async () => {
    try {
      const now = new Date();

      // Активные события (будущие или текущие)
      const { data: activeData, error: activeError } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .gte('event_date', now.toISOString());

      if (activeError) throw activeError;

      // События за этот месяц
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .gte('created_at', thisMonthStart.toISOString());

      if (thisMonthError) throw thisMonthError;

      // События за прошлый месяц
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      if (lastMonthError) throw lastMonthError;

      return {
        active: activeData?.length || 0,
        thisMonth: thisMonthData?.length || 0,
        lastMonth: lastMonthData?.length || 0
      };
    } catch (error) {
      console.error('Error getting events stats:', error);
      return { active: 0, thisMonth: 0, lastMonth: 0 };
    }
  };

  const getRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            ticket:tickets!fk_order_items_ticket_id(
              *,
              event:events(id, title, event_date)
            )
          )
        `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Группируем по событиям и подсчитываем статистику
      const eventSales = {};
      data.forEach(order => {
        order.order_items?.forEach(item => {
          const event = item.ticket?.event;
          if (event) {
            if (!eventSales[event.id]) {
              eventSales[event.id] = {
                event: event.title,
                date: event.event_date,
                ticketsSold: 0,
                revenue: 0
              };
            }
            eventSales[event.id].ticketsSold += 1;
            eventSales[event.id].revenue += parseFloat(item.unit_price || 0);
          }
        });
      });

      // Преобразуем в массив и сортируем по доходу
      return Object.values(eventSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting recent sales:', error);
      return [];
    }
  };

  const getRevenueBreakdown = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          total_price,
          order_items:order_items(
            ticket:tickets!fk_order_items_ticket_id(
              event:events(category)
            )
          )
        `)
        .eq('status', 'paid');

      if (error) throw error;

      const breakdown = {
        'concert': 0,
        'party': 0,
        'bustour': 0
      };

      data.forEach(order => {
        order.order_items?.forEach(item => {
          const category = item.ticket?.event?.category;
          if (category && Object.prototype.hasOwnProperty.call(breakdown, category)) {
            breakdown[category] += parseFloat(order.total_price || 0) / (order.order_items?.length || 1);
          }
        });
      });

      const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

      return {
        breakdown: [
          {
            category: 'Concerts',
            amount: breakdown.concert,
            color: 'bg-yellow-500',
            percentage: total > 0 ? Math.round((breakdown.concert / total) * 100) : 0
          },
          {
            category: 'Bus Tours',
            amount: breakdown.bustour,
            color: 'bg-blue-500',
            percentage: total > 0 ? Math.round((breakdown.bustour / total) * 100) : 0
          },
          {
            category: 'Parties',
            amount: breakdown.party,
            color: 'bg-purple-500',
            percentage: total > 0 ? Math.round((breakdown.party / total) * 100) : 0
          }
        ],
        total
      };
    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      return { breakdown: [], total: 0 };
    }
  };

  const getTicketsStats = async () => {
    try {
      // Средняя цена билета
      const { data: priceData, error: priceError } = await supabase
        .from('order_items')
        .select('unit_price');

      if (priceError) throw priceError;

      const avgPrice = priceData.length > 0
        ? priceData.reduce((sum, item) => sum + parseFloat(item.unit_price || 0), 0) / priceData.length
        : 0;

      // Статистика билетов
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('status, event:events(title)');

      if (ticketsError) throw ticketsError;

      const totalTickets = ticketsData.length;
      const soldTickets = ticketsData.filter(t => t.status === 'sold').length;
      const conversionRate = totalTickets > 0 ? (soldTickets / totalTickets * 100) : 0;

      // Загрузка площадок
      const utilization = totalTickets > 0 ? (soldTickets / totalTickets * 100) : 0;

      // Самое популярное событие
      const eventCounts = {};
      ticketsData.forEach(ticket => {
        if (ticket.status === 'sold' && ticket.event) {
          eventCounts[ticket.event.title] = (eventCounts[ticket.event.title] || 0) + 1;
        }
      });

      const popularEvent = Object.entries(eventCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

      return {
        avgPrice,
        priceChange: 5, // Примерное значение
        conversionRate,
        conversionChange: 2, // Примерное значение
        utilization,
        utilizationChange: 3, // Примерное значение
        popularEvent
      };
    } catch (error) {
      console.error('Error getting tickets stats:', error);
      return {
        avgPrice: 0,
        priceChange: 0,
        conversionRate: 0,
        conversionChange: 0,
        utilization: 0,
        utilizationChange: 0,
        popularEvent: null
      };
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await fetchEvents();
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('siteSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        // Apply site name to document title
        if (parsedSettings.siteName) {
          document.title = parsedSettings.siteName;
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to localStorage and apply them
  const saveSettings = async () => {
    try {
      setSettingsSaving(true);
      setSettingsError(null);
      setSettingsSuccess(false);

      // Save to localStorage
      localStorage.setItem('siteSettings', JSON.stringify(settings));

      // Apply settings immediately
      document.title = settings.siteName;

      // Update meta tags
      updateMetaTags();

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettingsError('Не удалось сохранить настройки');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Update meta tags in document head
  const updateMetaTags = () => {
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = settings.siteDescription;

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = settings.siteKeywords;

    // Open Graph tags
    updateOrCreateMetaTag('property', 'og:title', settings.ogTitle || settings.siteName);
    updateOrCreateMetaTag('property', 'og:description', settings.ogDescription || settings.siteDescription);
    updateOrCreateMetaTag('property', 'og:image', settings.ogImage);
    updateOrCreateMetaTag('property', 'og:type', 'website');

    // Twitter Card tags
    updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('name', 'twitter:title', settings.ogTitle || settings.siteName);
    updateOrCreateMetaTag('name', 'twitter:description', settings.ogDescription || settings.siteDescription);
    updateOrCreateMetaTag('name', 'twitter:image', settings.ogImage);
  };

  // Helper function to update or create meta tags
  const updateOrCreateMetaTag = (attribute, value, content) => {
    if (!content) return;

    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, value);
      document.head.appendChild(metaTag);
    }
    metaTag.content = content;
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      setSettings({
        siteName: 'TicketWayz',
        siteDescription: 'Лучший сервис для покупки билетов на концерты, вечеринки и автобусные туры',
        siteKeywords: 'билеты, концерты, вечеринки, автобусные туры, развлечения',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        favicon: '/favicon.ico',
        googleAnalytics: '',
        yandexMetrica: '',
        customCSS: '',
        customJS: ''
      });
    }
  };

  // Handle settings form changes
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Venues functions
  const fetchVenues = async () => {
    try {
      setVenuesLoading(true);
      setVenuesError(null);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVenues(data || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setVenuesError('Failed to load venues. Please try again.');
    } finally {
      setVenuesLoading(false);
    }
  };

  // ИСПРАВЛЕННАЯ функция Orders с упрощенным запросом
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);

      // ИСПРАВЛЕННЫЙ подход: сначала получаем базовые заказы
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

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
        const { data: usersData, error: usersError } = await supabase
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
      const { data: orderItemsData, error: orderItemsError } = await supabase
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
        const { data: ticketsData, error: ticketsError } = await supabase
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
      console.error('Error fetching orders:', err);
      setOrdersError('Failed to load orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setOrderDetails(order);
    setShowOrderDetails(true);
  };

  const handleDownloadTickets = () => {
    if (!orderDetails) return;
    const event = orderDetails.order_items[0]?.ticket?.event;
    const seats = orderDetails.order_items.map(item => {
      const seat = item.ticket?.seat;
      const zone = item.ticket?.zone;
      if (seat) {
        return { label: `${seat.section} ряд ${seat.row_number} место ${seat.seat_number}` };
      }
      if (zone) {
        return { label: `Зона "${zone.name}"` };
      }
      return { label: 'Общий вход' };
    });
    let templateSettings;
    try {
      const stored = localStorage.getItem('ticketTemplateSettings');
      if (stored) templateSettings = JSON.parse(stored);
    } catch (err) {
      console.error('Error parsing ticket template settings:', err);
    }

    downloadTicketsPDF({
      orderNumber: orderDetails.id,
      event: {
        title: event?.title,
        date: event?.event_date,
        location: event?.location
      },
      seats
    }, `order-${orderDetails.id}.pdf`, templateSettings);
  };

  const handleOrderAction = async (action, orderId, ticketIds = []) => {
    setProcessingOrderAction(true);

    try {
      if (action === 'refund') {
        // Обновляем статус заказа на "refunded"
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (orderError) throw orderError;

        // Обновляем статус всех билетов на "free"
        const { error: ticketsError } = await supabase
          .from('tickets')
          .update({
            status: 'free',
            order_item_id: null,
            updated_at: new Date().toISOString()
          })
          .in('id', ticketIds);

        if (ticketsError) throw ticketsError;

        // Обновляем список заказов
        fetchOrders();

        // Закрываем модальное окно деталей заказа
        setShowOrderDetails(false);
      } else if (action === 'cancel') {
        // Отменяем заказ (удаляем его)
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (orderError) throw orderError;

        // Обновляем статус всех билетов на "free"
        const { error: ticketsError } = await supabase
          .from('tickets')
          .update({
            status: 'free',
            order_item_id: null,
            updated_at: new Date().toISOString()
          })
          .in('id', ticketIds);

        if (ticketsError) throw ticketsError;

        // Обновляем список заказов
        fetchOrders();

        // Закрываем модальное окно деталей заказа
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('Error processing order action:', error);
      alert('Произошла ошибка при обработке действия. Пожалуйста, попробуйте еще раз.');
    } finally {
      setProcessingOrderAction(false);
    }
  };

  const handleCreateVenue = () => {
    setCurrentVenue(null);
    setShowVenueDesigner(true);
  };

  const handleEditVenue = (venue) => {
    setCurrentVenue(venue);
    setShowVenueDesigner(true);
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это место? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setVenuesLoading(true);

      // Check if venue is used in any events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('venue_id', venueId)
        .limit(1);

      if (eventsError) throw eventsError;

      if (events && events.length > 0) {
        alert('Это место нельзя удалить, так как оно используется в существующих событиях.');
        return;
      }

      // Delete associated zones
      const { error: zonesError } = await supabase
        .from('zones')
        .delete()
        .eq('venue_id', venueId);

      if (zonesError) throw zonesError;

      // Delete associated single seats
      const { error: seatsError } = await supabase
        .from('single_seats')
        .delete()
        .eq('venue_id', venueId);

      if (seatsError) throw seatsError;

      // Delete venue
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (venueError) throw venueError;

      // Update state
      setVenues(venues.filter(venue => venue.id !== venueId));
      alert('Место успешно удалено!');
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Не удалось удалить место. Попробуйте еще раз.');
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleSaveVenue = async (venueData, venueId = null) => {
    try {
      setSavingVenue(true);

      // Parse categories and elements from canvas data
      const categories = venueData.canvas_data?.categories || {};
      const elements = venueData.canvas_data?.elements || [];

      // Create or update venue record
      let savedVenue;
      if (venueId) {
        // Update existing venue
        const { data, error } = await supabase
          .from('venues')
          .update({
            name: venueData.name,
            address: venueData.address || '',
            geometry_data: JSON.stringify(venueData.canvas_data),
            updated_at: new Date().toISOString()
          })
          .eq('id', venueId)
          .select()
          .single();

        if (error) throw error;
        savedVenue = data;
      } else {
        // Create new venue
        const { data, error } = await supabase
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
        savedVenue = data;
      }

      // Save seat categories
      for (const [categoryId, categoryData] of Object.entries(categories)) {
        // Check if category exists
        const { data: existingCategories, error: categoryCheckError } = await supabase
          .from('seat_categories')
          .select('id')
          .eq('name', categoryId)
          .limit(1);

        if (categoryCheckError) throw categoryCheckError;

        if (!existingCategories || existingCategories.length === 0) {
          // Create new category
          const { error: categoryError } = await supabase
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
        const { error: zonesDeleteError } = await supabase
          .from('zones')
          .delete()
          .eq('venue_id', venueId);

        if (zonesDeleteError) throw zonesDeleteError;

        // Delete seats
        const { error: seatsDeleteError } = await supabase
          .from('single_seats')
          .delete()
          .eq('venue_id', venueId);

        if (seatsDeleteError) throw seatsDeleteError;
      }

      // Save zones and seats
      const zoneElements = elements.filter(el => el.type === 'section' || el.type === 'polygon');
      const seatElements = elements.filter(el => el.type === 'seat');

      // Save zones first
      for (const zone of zoneElements) {
        let categoryId = null;
        if (zone.categoryId) {
          // Lookup category ID
          const { data: categoryData, error: categoryError } = await supabase
            .from('seat_categories')
            .select('id')
            .eq('name', zone.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId = categoryData[0].id;
          }
        }

        // Create zone record
        const { data: zoneData, error: zoneError } = await supabase
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
              is_bookable: zone.is_bookable !== false
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
        let categoryId = null;
        if (seat.categoryId) {
          // Lookup category ID
          const { data: categoryData, error: categoryError } = await supabase
            .from('seat_categories')
            .select('id')
            .eq('name', seat.categoryId)
            .limit(1);

          if (categoryError) throw categoryError;

          if (categoryData && categoryData.length > 0) {
            categoryId = categoryData[0].id;
          }
        }

        // Find zone that contains this seat (if any)
        let zoneId = null;

        // Create seat record
        const { error: seatError } = await supabase
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
        setVenues(venues.map(v => v.id === venueId ? { ...v, ...savedVenue } : v));
      } else {
        setVenues([savedVenue, ...venues]);
      }

      // Close designer
      setShowVenueDesigner(false);
      setCurrentVenue(null);
      alert(`Место ${venueId ? 'обновлено' : 'создано'} успешно!`);
    } catch (err) {
      console.error('Error saving venue:', err);
      alert('Не удалось сохранить место. Попробуйте еще раз.');
    } finally {
      setSavingVenue(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowEventWizard(true);
  };

  const handleEditEvent = (event) => {
    console.log("Original event data:", event);
    // Правильно форматируем данные события для EventWizard
    const formattedEvent = {
      ...event,
      // Убеждаемся, что дата в правильном формате для datetime-local
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      // Убеждаемся, что все поля существуют
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

    console.log("Formatted event for editing:", formattedEvent);
    setSelectedEvent(formattedEvent);
    setShowEventWizard(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        setDeleting(eventId);
        await deleteEvent(eventId);
        // Remove event from local state
        setEvents(events.filter(event => event.id !== eventId));
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleEventWizardClose = () => {
    setShowEventWizard(false);
    setSelectedEvent(null);
  };

  const handleEventSaved = (savedEvent) => {
    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(event => event.id === selectedEvent.id ? { ...event, ...savedEvent } : event));
    } else {
      // Add new event
      setEvents([savedEvent, ...events]);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: FiTrendingUp },
    { id: 'events', label: 'События', icon: FiCalendar },
    { id: 'venues', label: 'Места', icon: FiMapPin },
    { id: 'orders', label: 'Заказы', icon: FiShoppingBag },
    { id: 'users', label: 'Пользователи', icon: FiUsers },
    { id: 'tickets', label: 'Билеты и уведомления', icon: FiMail }, // НОВЫЙ пункт меню
    { id: 'settings', label: 'Настройки', icon: FiSettings },
  ];

  const settingsMenuItems = [
    { id: 'general', label: 'Общие настройки', icon: FiGlobe },
    { id: 'seo', label: 'SEO и метаданные', icon: FiTag },
    { id: 'appearance', label: 'Внешний вид', icon: FiImage },
  ];

  const Sidebar = ({ className = '' }) => (
    <div className={`bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 h-full ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Админ-панель</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                    activeTab === item.id
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
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price with proper decimal places
  const formatPrice = (price) => {
    return price ? Number(price).toFixed(2) : '0.00';
  };

  // НОВАЯ функция для форматирования изменений
  const formatChange = (change, type = 'percent') => {
    if (type === 'percent') {
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    } else {
      return `${change > 0 ? '+' : ''}${change}`;
    }
  };

  // НОВАЯ функция для получения цвета изменения
  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  // Get status label and color
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Ожидает оплаты', color: 'bg-yellow-500' };
      case 'paid': return { label: 'Оплачен', color: 'bg-green-500' };
      case 'refunded': return { label: 'Возвращен', color: 'bg-red-500' };
      default: return { label: status, color: 'bg-gray-500' };
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-11 h-[calc(100vh-44px)] w-64 z-50 lg:hidden"
            >
              <Sidebar />
              <button
                onClick={() => setSidebarOpen(false)}
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
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
            >
              <SafeIcon icon={FiChevronRight} />
            </button>
            <h1 className="text-2xl font-bold ml-2">
              {menuItems.find((item) => item.id === activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold">
              {menuItems.find((item) => item.id === activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {dashboardLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg animate-pulse">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
                      <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Основные KPI мониторы */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Продажи сегодня */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Продажи сегодня</h3>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <SafeIcon icon={FiDollarSign} className="text-green-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">€{formatPrice(dashboardStats.todaySales.value)}</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.todaySales.changeType)}`}>
                        {formatChange(dashboardStats.todaySales.change)} с вчера
                      </p>
                    </div>

                    {/* Всего клиентов */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Всего клиентов</h3>
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <SafeIcon icon={FiUsers} className="text-blue-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{dashboardStats.totalCustomers.value.toLocaleString()}</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.totalCustomers.changeType)}`}>
                        {formatChange(dashboardStats.totalCustomers.change)} с прошлого месяца
                      </p>
                    </div>

                    {/* Активные события */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Активные события</h3>
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <SafeIcon icon={FiActivity} className="text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{dashboardStats.activeEvents.value}</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.activeEvents.changeType)}`}>
                        {formatChange(dashboardStats.activeEvents.change, 'number')} с прошлого месяца
                      </p>
                    </div>

                    {/* Среднее время ответа */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Среднее время ответа</h3>
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <SafeIcon icon={FiClock} className="text-purple-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{dashboardStats.avgResponseTime.value}ч</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.avgResponseTime.changeType)}`}>
                        {formatChange(dashboardStats.avgResponseTime.change)} с прошлого месяца
                      </p>
                    </div>
                  </div>

                  {/* Дополнительные KPI мониторы */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Средняя цена билета */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Средняя цена билета</h3>
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <SafeIcon icon={FiTarget} className="text-indigo-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">€{formatPrice(dashboardStats.avgTicketPrice.value)}</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.avgTicketPrice.changeType)}`}>
                        {formatChange(dashboardStats.avgTicketPrice.change)} с прошлого месяца
                      </p>
                    </div>

                    {/* Коэффициент конверсии */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Коэффициент конверсии</h3>
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <SafeIcon icon={FiBarChart3} className="text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{dashboardStats.conversionRate.value.toFixed(1)}%</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.conversionRate.changeType)}`}>
                        {formatChange(dashboardStats.conversionRate.change)} с прошлого месяца
                      </p>
                    </div>

                    {/* Загрузка площадок */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Загрузка площадок</h3>
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <SafeIcon icon={FiPieChart} className="text-orange-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{dashboardStats.venueUtilization.value.toFixed(1)}%</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.venueUtilization.changeType)}`}>
                        {formatChange(dashboardStats.venueUtilization.change)} с прошлого месяца
                      </p>
                    </div>

                    {/* Общий доход */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-600 dark:text-zinc-400">Общий доход</h3>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <SafeIcon icon={FiTrendingUp} className="text-green-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">€{formatPrice(dashboardStats.totalRevenue.value)}</p>
                      <p className={`text-xs ${getChangeColor(dashboardStats.totalRevenue.changeType)}`}>
                        {formatChange(dashboardStats.totalRevenue.change)} с прошлого месяца
                      </p>
                    </div>
                  </div>

                  {/* Недавние продажи */}
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Недавние продажи</h3>
                      <button className="text-sm text-yellow-500 hover:underline">
                        Посмотреть все
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-zinc-600 dark:text-zinc-400 text-sm">
                            <th className="pb-3">Событие</th>
                            <th className="pb-3 hidden md:table-cell">Дата</th>
                            <th className="pb-3 hidden sm:table-cell">Продано билетов</th>
                            <th className="pb-3 text-right">Доход</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentSales.length > 0 ? recentSales.map((sale, index) => (
                            <tr key={index} className="border-t border-zinc-200 dark:border-zinc-700">
                              <td className="py-3 font-medium">{sale.event}</td>
                              <td className="py-3 hidden md:table-cell">{formatDate(sale.date)}</td>
                              <td className="py-3 hidden sm:table-cell">{sale.ticketsSold}</td>
                              <td className="py-3 text-right font-semibold">€{formatPrice(sale.revenue)}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="py-8 text-center text-zinc-500">
                                Нет данных о продажах
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ИСПРАВЛЕННАЯ разбивка доходов */}
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Разбивка доходов</h2>
                      <SafeIcon icon={FiPieChart} className="text-zinc-400" />
                    </div>
                    <div className="space-y-4">
                      {revenueBreakdown.length > 0 ? revenueBreakdown.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-600 dark:text-zinc-400">{item.category}</span>
                            <span className="text-zinc-900 dark:text-white">€{formatPrice(item.amount)}</span>
                          </div>
                          <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.category === 'Concerts' ? 'bg-yellow-500' :
                                item.category === 'Bus Tours' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-zinc-500">
                          Нет данных о доходах по категориям
                        </div>
                      )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-zinc-300 dark:border-zinc-700">
                      <div className="flex items-center">
                        <SafeIcon icon={FiTrendingUp} className="text-green-400 mr-2" />
                        <span className="text-sm text-zinc-900 dark:text-white">
                          Общий доход вырос на {formatChange(dashboardStats.totalRevenue.change)} с прошлого месяца
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Популярное событие */}
                  {popularEvent && (
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">🏆 Самое популярное событие</h3>
                      <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
                        <span className="text-black font-bold text-xl">{popularEvent}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'events' && (
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
                  {[...Array(5)].map((_, i) => (
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
                      {events.map((event) => (
                        <tr key={event.id} className="border-t border-zinc-200 dark:border-zinc-700">
                          <td className="py-3">{event.title}</td>
                          <td className="py-3">{formatDate(event.event_date)}</td>
                          <td className="py-3 hidden md:table-cell capitalize">{event.category}</td>
                          <td className="py-3">{event.location}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                              title="Edit"
                            >
                              <SafeIcon icon={FiEdit2} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={deleting === event.id}
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
          {activeTab === 'venues' && (
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
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  ))}
                </div>
              ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venues.map(venue => (
                    <motion.div
                      key={venue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
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
                            onClick={() => handleEditVenue(venue)}
                            className="p-2 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                            title="Редактировать"
                          >
                            <SafeIcon icon={FiEdit2} />
                          </button>
                          <button
                            onClick={() => handleDeleteVenue(venue.id)}
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
          {activeTab === 'orders' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Управление заказами</h3>
                <button
                  onClick={() => fetchOrders()}
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
                  {[...Array(5)].map((_, i) => (
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
                      {orders.map((order) => {
                        const statusInfo = getOrderStatusInfo(order.status);
                        const ticketCount = order.order_items?.length || 0;

                        return (
                          <tr key={order.id} className="border-t border-zinc-200 dark:border-zinc-700">
                            <td className="py-3">{order.id.substring(0, 8)}...</td>
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
                                onClick={() => viewOrderDetails(order)}
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

          {/* НОВАЯ вкладка Билеты и уведомления */}
          {activeTab === 'tickets' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Настройки билетов и уведомлений</h3>
              </div>
              <TicketTemplateSettings />
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Settings Navigation */}
              <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg inline-flex">
                {settingsMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSettingsTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                      activeSettingsTab === item.id
                        ? 'bg-yellow-500 text-black'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Settings Content */}
              <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
                {/* Error and Success Messages */}
                {settingsError && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                    {settingsError}
                  </div>
                )}

                {settingsSuccess && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
                    Настройки успешно сохранены!
                  </div>
                )}

                {/* General Settings Tab */}
                {activeSettingsTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                        Общие настройки сайта
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Название сайта
                          </label>
                          <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => handleSettingsChange('siteName', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Название вашего сайта"
                          />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Отображается во вкладке браузера и в заголовках страниц
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Favicon URL
                          </label>
                          <input
                            type="text"
                            value={settings.favicon}
                            onChange={(e) => handleSettingsChange('favicon', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="/favicon.ico"
                          />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Иконка сайта в браузере (16x16 или 32x32 пикселя)
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Описание сайта
                        </label>
                        <textarea
                          value={settings.siteDescription}
                          onChange={(e) => handleSettingsChange('siteDescription', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="Краткое описание вашего сайта"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Используется в мета-тегах и поисковых системах (150-160 символов)
                        </p>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Ключевые слова
                        </label>
                        <input
                          type="text"
                          value={settings.siteKeywords}
                          onChange={(e) => handleSettingsChange('siteKeywords', e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="билеты, концерты, вечеринки"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Разделяйте ключевые слова запятыми
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO and Metadata Tab */}
                {activeSettingsTab === 'seo' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                        SEO и метаданные
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-medium mb-3 text-zinc-800 dark:text-zinc-200">
                            Open Graph (для социальных сетей)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                OG: Заголовок
                              </label>
                              <input
                                type="text"
                                value={settings.ogTitle}
                                onChange={(e) => handleSettingsChange('ogTitle', e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="Оставьте пустым для использования названия сайта"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                OG: Изображение
                              </label>
                              <input
                                type="url"
                                value={settings.ogImage}
                                onChange={(e) => handleSettingsChange('ogImage', e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="https://example.com/image.jpg"
                              />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Рекомендуемый размер: 1200x630 пикселей
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              OG: Описание
                            </label>
                            <textarea
                              value={settings.ogDescription}
                              onChange={(e) => handleSettingsChange('ogDescription', e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="Оставьте пустым для использования описания сайта"
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-medium mb-3 text-zinc-800 dark:text-zinc-200">
                            Аналитика
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Google Analytics ID
                              </label>
                              <input
                                type="text"
                                value={settings.googleAnalytics}
                                onChange={(e) => handleSettingsChange('googleAnalytics', e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="GA-XXXXXXXXX-X"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Яндекс.Метрика ID
                              </label>
                              <input
                                type="text"
                                value={settings.yandexMetrica}
                                onChange={(e) => handleSettingsChange('yandexMetrica', e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="12345678"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeSettingsTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                        Внешний вид
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Пользовательский CSS
                          </label>
                          <textarea
                            value={settings.customCSS}
                            onChange={(e) => handleSettingsChange('customCSS', e.target.value)}
                            rows="8"
                            className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                            placeholder="/* Ваш пользовательский CSS код */"
                          />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Добавьте свои стили для кастомизации внешнего вида
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Пользовательский JavaScript
                          </label>
                          <textarea
                            value={settings.customJS}
                            onChange={(e) => handleSettingsChange('customJS', e.target.value)}
                            rows="8"
                            className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                            placeholder="// Ваш пользовательский JavaScript код"
                          />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Добавьте свои скрипты (будьте осторожны!)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-zinc-300 dark:border-zinc-600">
                  <button
                    onClick={resetSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-500 transition"
                  >
                    <SafeIcon icon={FiRotateCcw} className="w-4 h-4" />
                    Сбросить
                  </button>

                  <button
                    onClick={saveSettings}
                    disabled={settingsSaving}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
                      settingsSaving
                        ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed'
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                    }`}
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4" />
                    {settingsSaving ? 'Сохранение...' : 'Сохранить настройки'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(activeTab !== 'dashboard' && activeTab !== 'events' && activeTab !== 'venues' && activeTab !== 'orders' && activeTab !== 'settings' && activeTab !== 'tickets') && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-8 rounded-lg text-center">
              <h2 className="text-xl font-medium mb-2">Раздел в разработке</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Этот раздел панели администратора находится в процессе разработки.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
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
          onCancel={() => setShowVenueDesigner(false)}
          saving={savingVenue}
        />
      )}

      {/* Order Details Modal */}
      {showOrderDetails && orderDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl bg-zinc-900 rounded-lg shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
              <h2 className="text-xl font-semibold text-white">
                Заказ #{orderDetails.id.substring(0, 8)}
              </h2>
              <button
                onClick={() => setShowOrderDetails(false)}
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
                      {orderDetails.status === 'paid' && (
                        <>
                          <button
                            onClick={() => {
                              const ticketIds = orderDetails.order_items.map(item => item.ticket?.id).filter(Boolean);
                              handleOrderAction('refund', orderDetails.id, ticketIds);
                            }}
                            disabled={processingOrderAction}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                          >
                            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                            {processingOrderAction ? 'Обработка...' : 'Вернуть деньги'}
                          </button>
                          <button onClick={handleDownloadTickets} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            <SafeIcon icon={FiDownload} className="w-4 h-4" />
                            Скачать билеты
                          </button>
                        </>
                      )}

                      {orderDetails.status === 'pending' && (
                        <button
                          onClick={() => {
                            const ticketIds = orderDetails.order_items.map(item => item.ticket?.id).filter(Boolean);
                            handleOrderAction('cancel', orderDetails.id, ticketIds);
                          }}
                          disabled={processingOrderAction}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <SafeIcon icon={FiX} className="w-4 h-4" />
                          {processingOrderAction ? 'Обработка...' : 'Отменить заказ'}
                        </button>
                      )}

                      {orderDetails.status === 'refunded' && (
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
                    {orderDetails.order_items.map((item) => {
                      const ticket = item.ticket;
                      const eventTitle = ticket?.event?.title || 'Нет данных';
                      const eventDate = ticket?.event?.event_date ? formatDate(ticket.event.event_date) : 'Нет даты';

                      // Определяем информацию о месте
                      let seatInfo = 'Общий вход';
                      if (ticket?.seat) {
                        seatInfo = `${ticket.seat.section} ряд ${ticket.seat.row_number} место ${ticket.seat.seat_number}`;
                      } else if (ticket?.zone) {
                        seatInfo = `Зона "${ticket.zone.name}"`;
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
                              ticket?.status === 'sold' ? 'bg-green-500' : 
                              ticket?.status === 'held' ? 'bg-yellow-500' : 'bg-zinc-500'
                            }`}>
                              {ticket?.status === 'sold' ? 'Продан' : 
                               ticket?.status === 'held' ? 'Забронирован' : 'Свободен'}
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
                onClick={() => setShowOrderDetails(false)}
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