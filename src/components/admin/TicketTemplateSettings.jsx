import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import supabase from '../../lib/supabase';
import { downloadTicketsPDF } from '../../utils/ticketExport';
import { formatDateTime } from '../../utils/formatDateTime';
import TicketLayoutSettings from './TicketLayoutSettings';
import SMTPSettings from './SMTPSettings';
import EmailTemplates from './EmailTemplates';

const {
  FiSave,
  FiRotateCcw,
  FiMail,
  FiServer,
  FiLayout,
} = FiIcons;

const TicketTemplateSettings = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const logoInputRef = useRef(null);
  const [lastSoldTicket, setLastSoldTicket] = useState(null);
  const [refreshingPreview, setRefreshingPreview] = useState(false);


  // Настройки шаблона билета
  const [templateSettings, setTemplateSettings] = useState({
    companyLogo: '',
    logoFile: null,
    colorScheme: {
      primary: '#FCD34D', // Yellow
      secondary: '#1F2937', // Dark gray
      accent: '#f59e0b',
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
      brand: 'TicketWayz',
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
      showTerms: true,
      customInstructions: '',
      termsAndConditions: '',
      additionalFields: []
    },
    design: {
      template: 'modern', // modern, classic, minimal
      showCompanyLogo: true,
      showQRCode: true,
      fontSize: 'medium', // small, medium, large
      layout: 'vertical', // vertical, horizontal
      heroUrl: '',
      darkHeader: false,
      rounded: 24,
      shadow: true,
      accent: '#f59e0b'
    }
  });

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
      brand: templateSettings.companyInfo?.brand || 'TicketWayz',
      heroImage: templateSettings.design?.heroUrl || lastSoldTicket.event?.image || '',
      artist: lastSoldTicket.event?.title || '',
      date: eventDate,
      time: eventTime,
      venue: lastSoldTicket.event?.location || '',
      address: lastSoldTicket.event?.note || '',
      section: lastSoldTicket.seat?.section,
      row: lastSoldTicket.seat?.row_number,
      seat: lastSoldTicket.seat?.seat_number,
      price: lastSoldTicket.order_item?.unit_price
        ? parseFloat(lastSoldTicket.order_item.unit_price).toFixed(2)
        : '',
      currency: '€',
      ticketId: lastSoldTicket.id
        ? `T-${lastSoldTicket.id.substring(0, 8)}`
        : '',
      ticketType: lastSoldTicket.seat
        ? 'seat'
        : lastSoldTicket.zone
          ? 'zone'
          : 'general',
    };
  }, [lastSoldTicket, templateSettings]);

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
        accent: '#f59e0b',
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
        accent: '#f59e0b',
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

  // Загрузка настроек из localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedTemplate = localStorage.getItem('ticketTemplateSettings');
        const savedSMTP = localStorage.getItem('smtpSettings');
        const savedEmail = localStorage.getItem('emailSettings');
        
        if (savedTemplate) {
          const parsed = JSON.parse(savedTemplate);
          setTemplateSettings(prev => ({
            ...prev,
            ...parsed,
            colorScheme: { ...prev.colorScheme, ...parsed.colorScheme },
            qrCode: { ...prev.qrCode, ...parsed.qrCode },
            companyInfo: { ...prev.companyInfo, ...parsed.companyInfo },
            ticketContent: { ...prev.ticketContent, ...parsed.ticketContent },
            design: { ...prev.design, ...parsed.design },
          }));
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
          accent: '#f59e0b',
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
          brand: 'TicketWayz',
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
          showTerms: true,
          customInstructions: '',
          termsAndConditions: '',
          additionalFields: []
        },
        design: {
          template: 'modern',
          showCompanyLogo: true,
          showQRCode: true,
          fontSize: 'medium',
          layout: 'vertical',
          heroUrl: '',
          darkHeader: false,
          rounded: 24,
          shadow: true,
          accent: '#f59e0b'
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
      company: { name: templateSettings.companyInfo?.brand || 'TicketWayz' },
      currency: '€',
      event: {
        title: lastSoldTicket.event?.title,
        date: lastSoldTicket.event?.event_date,
        location: lastSoldTicket.event?.location,
        note: lastSoldTicket.event?.note
      },
      seats: [
        {
          id: lastSoldTicket.id
            ? `T-${lastSoldTicket.id.substring(0, 8)}`
            : undefined,
          section: lastSoldTicket.seat?.section,
          row_number: lastSoldTicket.seat?.row_number,
          seat_number: lastSoldTicket.seat?.seat_number,
          price: lastSoldTicket.order_item?.unit_price,
          label: lastSoldTicket.seat
            ? `${lastSoldTicket.seat.section} ряд ${lastSoldTicket.seat.row_number} место ${lastSoldTicket.seat.seat_number}`
            : lastSoldTicket.zone
              ? `Зона "${lastSoldTicket.zone.name}"`
              : 'Общий вход'
        }
      ]
    };

    downloadTicketsPDF(orderData, 'ticket-preview', templateSettings);
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
          onChange={setTemplateSettings}
          onDownloadPreview={handleDownloadPreview}
          onRefreshPreview={handleRefreshPreview}
          ticketData={previewTicketData}
        />
      )}

      {/* SMTP Settings Tab */}
      {activeTab === 'smtp' && (
        <SMTPSettings settings={smtpSettings} onChange={setSmtpSettings} />
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <EmailTemplates settings={emailSettings} onChange={setEmailSettings} />
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