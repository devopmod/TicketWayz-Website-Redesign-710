import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiMail, FiEye, FiCode, FiSend, FiInfo } = FiIcons;

const EmailTemplateEditor = ({ template, onChange, onPreview, onSendTest }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const availableVariables = [
    { var: '{customerName}', desc: 'Имя клиента' },
    { var: '{eventTitle}', desc: 'Название события' },
    { var: '{eventDate}', desc: 'Дата события' },
    { var: '{eventTime}', desc: 'Время события' },
    { var: '{eventLocation}', desc: 'Место проведения' },
    { var: '{orderNumber}', desc: 'Номер заказа' },
    { var: '{ticketCount}', desc: 'Количество билетов' },
    { var: '{totalPrice}', desc: 'Общая сумма' },
    { var: '{seatInfo}', desc: 'Информация о местах' },
    { var: '{companyName}', desc: 'Название компании' },
    { var: '{companyEmail}', desc: 'Email компании' },
    { var: '{companyPhone}', desc: 'Телефон компании' },
    { var: '{supportEmail}', desc: 'Email поддержки' }
  ];

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template.template;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      onChange({
        ...template,
        template: newText
      });

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  const generatePreview = () => {
    const sampleData = {
      '{customerName}': 'Иван Петров',
      '{eventTitle}': 'Концерт группы "Пример"',
      '{eventDate}': '15 декабря 2024',
      '{eventTime}': '20:00',
      '{eventLocation}': 'Концертный зал "Олимпийский"',
      '{orderNumber}': 'TW-123456',
      '{ticketCount}': '2',
      '{totalPrice}': '5000 ₽',
      '{seatInfo}': 'Партер, ряд 5, места 12-13',
      '{companyName}': 'TicketWayz',
      '{companyEmail}': 'info@ticketwayz.com',
      '{companyPhone}': '+7 (999) 123-45-67',
      '{supportEmail}': 'support@ticketwayz.com'
    };

    let preview = template.template;
    Object.entries(sampleData).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert('Введите email адрес для отправки тестового письма');
      return;
    }

    setSendingTest(true);
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSendTest) {
        onSendTest(testEmail, template);
      }
      
      alert('Тестовое письмо отправлено!');
      setTestEmail('');
    } catch (error) {
      alert('Ошибка при отправке тестового письма');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Тема письма
          </label>
          <input
            type="text"
            value={template.subject}
            onChange={(e) => onChange({ ...template, subject: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
            placeholder="Тема письма..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Дополнительные настройки
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={template.enabled}
                onChange={(e) => onChange({ ...template, enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Включить отправку
              </span>
            </label>

            {template.daysBefore !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">За</span>
                <select
                  value={template.daysBefore}
                  onChange={(e) => onChange({ ...template, daysBefore: parseInt(e.target.value) })}
                  className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-sm"
                >
                  <option value={1}>1 день</option>
                  <option value={2}>2 дня</option>
                  <option value={3}>3 дня</option>
                  <option value={7}>1 неделю</option>
                </select>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">до события</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor/Preview Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(false)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition ${
              !previewMode
                ? 'bg-yellow-500 text-black'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            <SafeIcon icon={FiCode} className="w-4 h-4" />
            Редактор
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition ${
              previewMode
                ? 'bg-yellow-500 text-black'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            <SafeIcon icon={FiEye} className="w-4 h-4" />
            Предпросмотр
          </button>
        </div>

        {/* Test Email */}
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-sm"
          />
          <button
            onClick={handleSendTest}
            disabled={sendingTest || !testEmail}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${
              sendingTest || !testEmail
                ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <SafeIcon icon={FiSend} className="w-3 h-3" />
            {sendingTest ? 'Отправка...' : 'Тест'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Variables Panel */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <SafeIcon icon={FiInfo} className="w-4 h-4" />
              Переменные
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableVariables.map((item, index) => (
                <button
                  key={index}
                  onClick={() => insertVariable(item.var)}
                  className="w-full text-left p-2 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600 transition"
                >
                  <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                    {item.var}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor/Preview */}
        <div className="lg:col-span-3">
          {!previewMode ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Шаблон письма
              </label>
              <textarea
                id="template-textarea"
                value={template.template}
                onChange={(e) => onChange({ ...template, template: e.target.value })}
                rows="16"
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg font-mono text-sm"
                placeholder="Введите текст шаблона письма..."
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Используйте переменные из панели слева для вставки динамических данных
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Предпросмотр письма
              </label>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg p-4 min-h-[400px]">
                <div className="border-b border-zinc-200 dark:border-zinc-700 pb-3 mb-4">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Тема:</div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    {template.subject.replace('{eventTitle}', 'Концерт группы "Пример"')}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {generatePreview()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;