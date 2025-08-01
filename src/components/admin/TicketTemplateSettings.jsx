import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { 
  FiUpload, 
  FiTrash2, 
  FiSave, 
  FiRotateCcw, 
  FiImage, 
  FiSettings, 
  FiMail,
  FiServer,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX
} = FiIcons;

const TicketTemplateSettings = () => {
  const [activeTab, setActiveTab] = useState('template');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const logoInputRef = useRef(null);

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

  const tabs = [
    { id: 'template', label: 'Шаблон билета', icon: FiImage },
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

      {/* Template Settings Tab */}
      {activeTab === 'template' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Company Logo */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
              Логотип компании
            </h3>
            
            <div className="space-y-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <div className="flex items-center gap-4">
                {templateSettings.companyLogo ? (
                  <div className="relative">
                    <img
                      src={templateSettings.companyLogo}
                      alt="Company Logo"
                      className="w-24 h-24 object-contain border rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <SafeIcon icon={FiX} className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg flex items-center justify-center">
                    <SafeIcon icon={FiImage} className="w-8 h-8 text-zinc-400" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <SafeIcon icon={FiUpload} className="w-4 h-4" />
                    Загрузить логотип
                  </button>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Поддерживаемые форматы: JPG, PNG, SVG<br />
                    Максимальный размер: 2MB<br />
                    Рекомендуемое разрешение: 200x200 пикселей
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
              Цветовая схема
            </h3>
            
            <div className="space-y-4">
              {/* Preset Color Schemes */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Готовые схемы
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {colorSchemePresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSchemeChange(preset.colors)}
                      className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </div>
                      <span className="text-sm text-zinc-900 dark:text-white">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Основной цвет
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateSettings.colorScheme.primary}
                      onChange={(e) => handleNestedChange('colorScheme', 'primary', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={templateSettings.colorScheme.primary}
                      onChange={(e) => handleNestedChange('colorScheme', 'primary', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Вторичный цвет
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateSettings.colorScheme.secondary}
                      onChange={(e) => handleNestedChange('colorScheme', 'secondary', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={templateSettings.colorScheme.secondary}
                      onChange={(e) => handleNestedChange('colorScheme', 'secondary', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Акцентный цвет
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateSettings.colorScheme.accent}
                      onChange={(e) => handleNestedChange('colorScheme', 'accent', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={templateSettings.colorScheme.accent}
                      onChange={(e) => handleNestedChange('colorScheme', 'accent', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Фон
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateSettings.colorScheme.background}
                      onChange={(e) => handleNestedChange('colorScheme', 'background', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={templateSettings.colorScheme.background}
                      onChange={(e) => handleNestedChange('colorScheme', 'background', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Текст
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateSettings.colorScheme.text}
                      onChange={(e) => handleNestedChange('colorScheme', 'text', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={templateSettings.colorScheme.text}
                      onChange={(e) => handleNestedChange('colorScheme', 'text', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
              Настройки QR-кода
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Размер QR-кода
                </label>
                <select
                  value={templateSettings.qrCode.size}
                  onChange={(e) => handleNestedChange('qrCode', 'size', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                >
                  {qrSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Позиция QR-кода
                </label>
                <select
                  value={templateSettings.qrCode.position}
                  onChange={(e) => handleNestedChange('qrCode', 'position', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                >
                  {qrPositionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Информация в QR-коде
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateSettings.qrCode.includeEventInfo}
                    onChange={(e) => handleNestedChange('qrCode', 'includeEventInfo', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Информация о событии
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateSettings.qrCode.includeSeatInfo}
                    onChange={(e) => handleNestedChange('qrCode', 'includeSeatInfo', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Информация о месте
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateSettings.qrCode.includeOrderInfo}
                    onChange={(e) => handleNestedChange('qrCode', 'includeOrderInfo', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Информация о заказе
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
              Информация о компании
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Название компании
                </label>
                <input
                  type="text"
                  value={templateSettings.companyInfo.name}
                  onChange={(e) => handleNestedChange('companyInfo', 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="TicketWayz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={templateSettings.companyInfo.email}
                  onChange={(e) => handleNestedChange('companyInfo', 'email', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="info@ticketwayz.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={templateSettings.companyInfo.phone}
                  onChange={(e) => handleNestedChange('companyInfo', 'phone', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Веб-сайт
                </label>
                <input
                  type="url"
                  value={templateSettings.companyInfo.website}
                  onChange={(e) => handleNestedChange('companyInfo', 'website', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="https://ticketwayz.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Адрес
                </label>
                <textarea
                  value={templateSettings.companyInfo.address}
                  onChange={(e) => handleNestedChange('companyInfo', 'address', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="г. Москва, ул. Примерная, д. 123"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
              Дополнительные настройки
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Шаблон дизайна
                </label>
                <select
                  value={templateSettings.design.template}
                  onChange={(e) => handleNestedChange('design', 'template', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                >
                  {templateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Инструкции для посетителей
                </label>
                <textarea
                  value={templateSettings.ticketContent.customInstructions}
                  onChange={(e) => handleNestedChange('ticketContent', 'customInstructions', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="Дополнительные инструкции для посетителей..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Условия использования билета
                </label>
                <textarea
                  value={templateSettings.ticketContent.termsAndConditions}
                  onChange={(e) => handleNestedChange('ticketContent', 'termsAndConditions', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="Условия использования билета, правила возврата и т.д."
                />
              </div>

              {/* Custom Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Дополнительные поля
                  </label>
                  <button
                    onClick={addCustomField}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Добавить поле
                  </button>
                </div>
                
                <div className="space-y-3">
                  {templateSettings.ticketContent.additionalFields.map((field, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                        placeholder="Название поля"
                        className="flex-1 px-2 py-1 bg-zinc-300 dark:bg-zinc-600 rounded"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        placeholder="Значение"
                        className="flex-1 px-2 py-1 bg-zinc-300 dark:bg-zinc-600 rounded"
                      />
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                          className="mr-1"
                        />
                        Обязательное
                      </label>
                      <button
                        onClick={() => removeCustomField(index)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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