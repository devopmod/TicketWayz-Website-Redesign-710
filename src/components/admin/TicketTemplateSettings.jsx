import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import supabase from '../../lib/supabase';
import { downloadTicketsPDF } from '../../utils/pdfGenerator';
import { formatDateTime } from '../../utils/formatDateTime';
import TicketLayoutSettings from './TicketLayoutSettings';

const {
  FiSave,
  FiRotateCcw,
  FiMail,
  FiServer,
  FiEye,
  FiEyeOff,
  FiLayout,
} = FiIcons;

const TicketTemplateSettings = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const logoInputRef = useRef(null);
  const [lastSoldTicket, setLastSoldTicket] = useState(null);
  const [refreshingPreview, setRefreshingPreview] = useState(false);

  // Формируем данные билета для предпросмотра на основе последнего проданного билета
  const previewTicketData = useMemo(() => {
    if (!lastSoldTicket) return null;
    const eventDateRaw = lastSoldTicket.event?.event_date;
    let eventDate = '';
    let eventTime = '';
    if (eventDateRaw) {
      const { date, time } = formatDateTime(eventDateRaw);
      eventDate = date;
      eventTime = time;
    }
    return {
      eventTitle: lastSoldTicket.event?.title || '',
      eventDate,
      eventTime,
      eventLocation: lastSoldTicket.event?.location || '',
      orderNumber: lastSoldTicket.order_item?.order?.id
        ? `TW-${lastSoldTicket.order_item.order.id.substring(0, 6)}`
        : '',
      seatInfo: lastSoldTicket.seat
        ? `${lastSoldTicket.seat.section} ряд ${lastSoldTicket.seat.row_number} место ${lastSoldTicket.seat.seat_number}`
        : lastSoldTicket.zone
          ? `Зона "${lastSoldTicket.zone.name}"`
          : 'Общий вход',
      price: lastSoldTicket.order_item?.unit_price
        ? `€${parseFloat(lastSoldTicket.order_item.unit_price).toFixed(2)}`
        : '',
      ticketNumber: lastSoldTicket.id
        ? `T-${lastSoldTicket.id.substring(0, 8)}`
        : ''
    };
  }, [lastSoldTicket]);

  // Настройки шаблона билета
  const [templateSettings, setTemplateSettings] = useState({
    companyLogo: '',
    logoFile: null,
    colorScheme: {
      primary: '#FCD34D', // Yellow
      secondary: '#1F2937', // Dark gray
      accent: '#10B981', // Green
      background: '#FFFFFF',
      text: '#000000'
    },
    qrCode: {
      size: 'medium', // small, medium, large
      position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
      includeEventInfo: true,
      includeSeatInfo: true,
      includeOrderInfo: true
    },
    companyInfo: {
      name: 'TicketWayz',
      address: '',
      phone: '',
      website: '',
      email: ''
    },
    ticketContent: {
      showEventDescription: true,
      showVenueInfo: true,
      showDateTime: true,
      showPrice: true,
      customInstructions: '',
      termsAndConditions: '',
      additionalFields: []
    },
    design: {
      template: 'modern', // modern, classic, minimal
      showCompanyLogo: true,
      showQRCode: true,
      fontSize: 'medium', // small, medium, large
      layout: 'vertical' // vertical, horizontal
    }
  });

  // Настройки SMTP
  const [smtpSettings, setSmtpSettings] = useState({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    security: 'tls', // none, tls, ssl
    senderEmail: '',
    senderName: 'TicketWayz',
    replyTo: ''
  });

  // Настройки email шаблонов
  const [emailSettings, setEmailSettings] = useState({
    purchaseConfirmation: {
      enabled: true,
      subject: 'Ваши билеты - {eventTitle}',
      template: `Здравствуйте, {customerName}!

Спасибо за покупку билетов на {eventTitle}.

Детали заказа:
- Заказ №: {orderNumber}
- Событие: {eventTitle}
- Дата: {eventDate}
- Место: {eventLocation}
- Количество билетов: {ticketCount}
- Общая сумма: {totalPrice}

Ваши билеты находятся во вложении к этому письму.

С уважением,
Команда TicketWayz`
    },
    eventReminder: {
      enabled: true,
      daysBefore: 1,
      subject: 'Напоминание о событии - {eventTitle}',
      template: `Здравствуйте, {customerName}!

Напоминаем, что завтра состоится событие {eventTitle}.

Детали:
- Дата: {eventDate}
- Время: {eventTime}
- Место: {eventLocation}
- Ваши места: {seatInfo}

Не забудьте взять с собой билеты!

С уважением,
Команда TicketWayz`
    }
  });

  // Загрузка данных последнего проданного билета при монтировании компонента
  useEffect(() => {
    const fetchLastSoldTicket = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            event:events(title, event_date, location, note),
            zone:zones(name),
            seat:single_seats(row_number, seat_number, section),
            order_item:order_items!tickets_order_item_id_fkey(
              unit_price,
              order:orders(id, user_id, total_price)
            )
          `)
          .eq('status', 'sold')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching last sold ticket:', error);
        } else if (data) {
          console.log('Last sold ticket:', data);
          setLastSoldTicket(data);
        }
      } catch (err) {
        console.error('Error fetching ticket data:', err);
      }
    };

    fetchLastSoldTicket();
  }, []);

  const colorSchemePresets = [
    {
      name: 'Желтый (по умолчанию)',
      colors: {
        primary: '#FCD34D',
        secondary: '#1F2937',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#000000'
      }
    },
    {
      name: 'Синий корпоративный',
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#06B6D4',
        background: '#FFFFFF',
        text: '#000000'
      }
    },
    {
      name: 'Фиолетовый элегантный',
      colors: {
        primary: '#8B5CF6',
        secondary: '#6D28D9',
        accent: '#A78BFA',
        background: '#FFFFFF',
        text: '#000000'
      }
    },
    {
      name: 'Темная тема',
      colors: {
        primary: '#FCD34D',
        secondary: '#374151',
        accent: '#10B981',
        background: '#111827',
        text: '#FFFFFF'
      }
    }
  ];

  const qrSizeOptions = [
    { value: 'small', label: 'Маленький (64px)' },
    { value: 'medium', label: 'Средний (96px)' },
    { value: 'large', label: 'Большой (128px)' }
  ];

  const qrPositionOptions = [
    { value: 'top-left', label: 'Верх слева' },
    { value: 'top-right', label: 'Верх справа' },
    { value: 'bottom-left', label: 'Низ слева' },
    { value: 'bottom-right', label: 'Низ справа' },
    { value: 'center', label: 'По центру' }
  ];

  const templateOptions = [
    { value: 'modern', label: 'Современный' },
    { value: 'classic', label: 'Классический' },
    { value: 'minimal', label: 'Минималистичный' }
  ];

  const securityOptions = [
    { value: 'none', label: 'Без шифрования' },
    { value: 'tls', label: 'TLS/STARTTLS' },
    { value: 'ssl', label: 'SSL' }
  ];

  // Загрузка настроек из localStorage
  React.useEffect(() => {
    const loadSettings = () => {
      try {
        const savedTemplate = localStorage.getItem('ticketTemplateSettings');
        const savedSMTP = localStorage.getItem('smtpSettings');
        const savedEmail = localStorage.getItem('emailSettings');
        
        if (savedTemplate) {
          setTemplateSettings(prev => ({ ...prev, ...JSON.parse(savedTemplate) }));
        }
        
        if (savedSMTP) {
          setSmtpSettings(prev => ({ ...prev, ...JSON.parse(savedSMTP) }));
        }
        
        if (savedEmail) {
          setEmailSettings(prev => ({ ...prev, ...JSON.parse(savedEmail) }));
        }
      } catch (error) {
        console.error('Error loading ticket settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения');
      return;
    }
    
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Размер файла не должен превышать 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setTemplateSettings(prev => ({
        ...prev,
        companyLogo: event.target.result,
        logoFile: file
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setTemplateSettings(prev => ({
      ...prev,
      companyLogo: '',
      logoFile: null
    }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleColorSchemeChange = (colors) => {
    setTemplateSettings(prev => ({
      ...prev,
      colorScheme: colors
    }));
  };

  const handleTemplateChange = (field, value) => {
    setTemplateSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setTemplateSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSMTPChange = (field, value) => {
    setSmtpSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailChange = (section, field, value) => {
    setEmailSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addCustomField = () => {
    setTemplateSettings(prev => ({
      ...prev,
      ticketContent: {
        ...prev.ticketContent,
        additionalFields: [
          ...prev.ticketContent.additionalFields,
          { name: '', value: '', required: false }
        ]
      }
    }));
  };

  const removeCustomField = (index) => {
    setTemplateSettings(prev => ({
      ...prev,
      ticketContent: {
        ...prev.ticketContent,
        additionalFields: prev.ticketContent.additionalFields.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCustomField = (index, field, value) => {
    setTemplateSettings(prev => ({
      ...prev,
      ticketContent: {
        ...prev.ticketContent,
        additionalFields: prev.ticketContent.additionalFields.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const testSMTPConnection = async () => {
    setSaving(true);
    setError(null);
    try {
      // Здесь будет логика тестирования SMTP соединения
      // Пока что имитируем успешное подключение
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Ошибка подключения к SMTP серверу');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      localStorage.setItem('ticketTemplateSettings', JSON.stringify(templateSettings));
      localStorage.setItem('smtpSettings', JSON.stringify(smtpSettings));
      localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все настройки билетов к значениям по умолчанию?')) {
      setTemplateSettings({
        companyLogo: '',
        logoFile: null,
        colorScheme: {
          primary: '#FCD34D',
          secondary: '#1F2937',
          accent: '#10B981',
          background: '#FFFFFF',
          text: '#000000'
        },
        qrCode: {
          size: 'medium',
          position: 'bottom-right',
          includeEventInfo: true,
          includeSeatInfo: true,
          includeOrderInfo: true
        },
        companyInfo: {
          name: 'TicketWayz',
          address: '',
          phone: '',
          website: '',
          email: ''
        },
        ticketContent: {
          showEventDescription: true,
          showVenueInfo: true,
          showDateTime: true,
          showPrice: true,
          customInstructions: '',
          termsAndConditions: '',
          additionalFields: []
        },
        design: {
          template: 'modern',
          showCompanyLogo: true,
          showQRCode: true,
          fontSize: 'medium',
          layout: 'vertical'
        }
      });
      
      setSmtpSettings({
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        security: 'tls',
        senderEmail: '',
        senderName: 'TicketWayz',
        replyTo: ''
      });
      
      setEmailSettings({
        purchaseConfirmation: {
          enabled: true,
          subject: 'Ваши билеты - {eventTitle}',
          template: `Здравствуйте, {customerName}!

Спасибо за покупку билетов на {eventTitle}.

Детали заказа:
- Заказ №: {orderNumber}
- Событие: {eventTitle}
- Дата: {eventDate}
- Место: {eventLocation}
- Количество билетов: {ticketCount}
- Общая сумма: {totalPrice}

Ваши билеты находятся во вложении к этому письму.

С уважением,
Команда TicketWayz`
        },
        eventReminder: {
          enabled: true,
          daysBefore: 1,
          subject: 'Напоминание о событии - {eventTitle}',
          template: `Здравствуйте, {customerName}!

Напоминаем, что завтра состоится событие {eventTitle}.

Детали:
- Дата: {eventDate}
- Время: {eventTime}
- Место: {eventLocation}
- Ваши места: {seatInfo}

Не забудьте взять с собой билеты!

С уважением,
Команда TicketWayz`
        }
      });
    }
  };

  const handleRefreshPreview = async () => {
    setRefreshingPreview(true);
    try {
      // Перезагрузка данных последнего проданного билета
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events(title, event_date, location, note),
          zone:zones(name),
          seat:single_seats(row_number, seat_number, section),
          order_item:order_items(
            unit_price,
            order:orders(id, user_id, total_price)
          )
        `)
        .eq('status', 'sold')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error refreshing ticket data:', error);
      } else if (data) {
        console.log('Refreshed ticket data:', data);
        setLastSoldTicket(data);
      }
    } catch (err) {
      console.error('Error refreshing ticket data:', err);
    } finally {
      setRefreshingPreview(false);
    }
  };

  const handleDownloadPreview = async () => {
    if (!lastSoldTicket) return;

    // Ensure current settings are saved before generating preview
    await saveSettings();

    const orderData = {
      orderNumber: lastSoldTicket.order_item?.order?.id,
      event: {
        title: lastSoldTicket.event?.title,
        date: lastSoldTicket.event?.event_date,
        location: lastSoldTicket.event?.location,
        note: lastSoldTicket.event?.note
      },
      seats: [
        {
          label: lastSoldTicket.seat
            ? `${lastSoldTicket.seat.section} ряд ${lastSoldTicket.seat.row_number} место ${lastSoldTicket.seat.seat_number}`
            : lastSoldTicket.zone
              ? `Зона "${lastSoldTicket.zone.name}"`
              : 'Общий вход'
        }
      ]
    };

    downloadTicketsPDF(orderData, 'ticket-preview.pdf', templateSettings);
  };

  const tabs = [
    { id: 'layout', label: 'Макет билета', icon: FiLayout },
    { id: 'smtp', label: 'SMTP настройки', icon: FiServer },
    { id: 'email', label: 'Email шаблоны', icon: FiMail }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg inline-flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-yellow-500 text-black'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <SafeIcon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg">
          Настройки успешно сохранены!
        </div>
      )}

      {/* Ticket Layout Tab */}
      {activeTab === 'layout' && (
        <TicketLayoutSettings
          settings={templateSettings}
          onDownloadPreview={handleDownloadPreview}
          onRefreshPreview={handleRefreshPreview}
          ticketData={previewTicketData}
        />
      )}

      {/* SMTP Settings Tab */}
      {activeTab === 'smtp' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                SMTP Сервер
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smtpSettings.enabled}
                  onChange={(e) => handleSMTPChange('enabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Включить отправку email
                </span>
              </label>
            </div>

            {smtpSettings.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      SMTP хост
                    </label>
                    <input
                      type="text"
                      value={smtpSettings.host}
                      onChange={(e) => handleSMTPChange('host', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Порт
                    </label>
                    <input
                      type="number"
                      value={smtpSettings.port}
                      onChange={(e) => handleSMTPChange('port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      value={smtpSettings.username}
                      onChange={(e) => handleSMTPChange('username', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpSettings.password}
                        onChange={(e) => handleSMTPChange('password', e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500"
                      >
                        <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Безопасность
                    </label>
                    <select
                      value={smtpSettings.security}
                      onChange={(e) => handleSMTPChange('security', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                    >
                      {securityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Email отправителя
                    </label>
                    <input
                      type="email"
                      value={smtpSettings.senderEmail}
                      onChange={(e) => handleSMTPChange('senderEmail', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="noreply@ticketwayz.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Имя отправителя
                    </label>
                    <input
                      type="text"
                      value={smtpSettings.senderName}
                      onChange={(e) => handleSMTPChange('senderName', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="TicketWayz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Ответить на (Reply-To)
                    </label>
                    <input
                      type="email"
                      value={smtpSettings.replyTo}
                      onChange={(e) => handleSMTPChange('replyTo', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                      placeholder="support@ticketwayz.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={testSMTPConnection}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Тестирование...' : 'Тест подключения'}
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Популярные SMTP настройки
                  </h4>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <div><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</div>
                    <div><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</div>
                    <div><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</div>
                    <div><strong>Yandex:</strong> smtp.yandex.ru:465 (SSL)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Purchase Confirmation Email */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Подтверждение покупки
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.purchaseConfirmation.enabled}
                  onChange={(e) => handleEmailChange('purchaseConfirmation', 'enabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Включить
                </span>
              </label>
            </div>

            {emailSettings.purchaseConfirmation.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Тема письма
                  </label>
                  <input
                    type="text"
                    value={emailSettings.purchaseConfirmation.subject}
                    onChange={(e) => handleEmailChange('purchaseConfirmation', 'subject', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                    placeholder="Ваши билеты - {eventTitle}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Шаблон письма
                  </label>
                  <textarea
                    value={emailSettings.purchaseConfirmation.template}
                    onChange={(e) => handleEmailChange('purchaseConfirmation', 'template', e.target.value)}
                    rows="10"
                    className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg font-mono text-sm"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Доступные переменные
                  </h4>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 grid grid-cols-2 gap-1">
                    <div>{'{customerName}'} - Имя клиента</div>
                    <div>{'{eventTitle}'} - Название события</div>
                    <div>{'{eventDate}'} - Дата события</div>
                    <div>{'{eventTime}'} - Время события</div>
                    <div>{'{eventLocation}'} - Место проведения</div>
                    <div>{'{orderNumber}'} - Номер заказа</div>
                    <div>{'{ticketCount}'} - Количество билетов</div>
                    <div>{'{totalPrice}'} - Общая сумма</div>
                    <div>{'{seatInfo}'} - Информация о местах</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Reminder Email */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Напоминание о событии
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.eventReminder.enabled}
                  onChange={(e) => handleEmailChange('eventReminder', 'enabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Включить
                </span>
              </label>
            </div>

            {emailSettings.eventReminder.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Отправить за ... дней до события
                  </label>
                  <select
                    value={emailSettings.eventReminder.daysBefore}
                    onChange={(e) => handleEmailChange('eventReminder', 'daysBefore', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  >
                    <option value={1}>1 день</option>
                    <option value={2}>2 дня</option>
                    <option value={3}>3 дня</option>
                    <option value={7}>1 неделя</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Тема письма
                  </label>
                  <input
                    type="text"
                    value={emailSettings.eventReminder.subject}
                    onChange={(e) => handleEmailChange('eventReminder', 'subject', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                    placeholder="Напоминание о событии - {eventTitle}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Шаблон письма
                  </label>
                  <textarea
                    value={emailSettings.eventReminder.template}
                    onChange={(e) => handleEmailChange('eventReminder', 'template', e.target.value)}
                    rows="8"
                    className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
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
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
            saving
              ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          <SafeIcon icon={FiSave} className="w-4 h-4" />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
};

export default TicketTemplateSettings;