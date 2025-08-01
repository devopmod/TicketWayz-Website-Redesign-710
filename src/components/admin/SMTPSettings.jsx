import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiServer, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiAlertCircle } = FiIcons;

const SMTPSettings = ({ settings, onChange, onTest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const securityOptions = [
    { value: 'none', label: 'Без шифрования' },
    { value: 'tls', label: 'TLS/STARTTLS' },
    { value: 'ssl', label: 'SSL' }
  ];

  const presetConfigs = [
    {
      name: 'Gmail',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        security: 'tls'
      }
    },
    {
      name: 'Outlook',
      config: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        security: 'tls'
      }
    },
    {
      name: 'Yahoo',
      config: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        security: 'tls'
      }
    },
    {
      name: 'Yandex',
      config: {
        host: 'smtp.yandex.ru',
        port: 465,
        security: 'ssl'
      }
    }
  ];

  const handlePresetSelect = (preset) => {
    onChange({
      ...settings,
      ...preset.config
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate SMTP test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo
      const success = Math.random() > 0.3;
      
      if (success) {
        setTestResult({
          success: true,
          message: 'Подключение к SMTP серверу установлено успешно!'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Не удалось подключиться к SMTP серверу. Проверьте настройки.'
        });
      }

      if (onTest) {
        onTest(success);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка при тестировании подключения'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Enable SMTP */}
      <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-white">
            Отправка email уведомлений
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Включите для автоматической отправки билетов и уведомлений
          </p>
        </div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Включить
          </span>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Preset Configurations */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
              Быстрая настройка
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetConfigs.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-2 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-600 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* SMTP Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                SMTP хост *
              </label>
              <input
                type="text"
                value={settings.host}
                onChange={(e) => onChange({ ...settings, host: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="smtp.gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Порт *
              </label>
              <input
                type="number"
                value={settings.port}
                onChange={(e) => onChange({ ...settings, port: parseInt(e.target.value) || 587 })}
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="587"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Имя пользователя *
              </label>
              <input
                type="text"
                value={settings.username}
                onChange={(e) => onChange({ ...settings, username: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="your-email@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Пароль *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.password}
                  onChange={(e) => onChange({ ...settings, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
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
                value={settings.security}
                onChange={(e) => onChange({ ...settings, security: e.target.value })}
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
                Email отправителя *
              </label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => onChange({ ...settings, senderEmail: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="noreply@ticketwayz.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Имя отправителя
              </label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => onChange({ ...settings, senderName: e.target.value })}
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
                value={settings.replyTo}
                onChange={(e) => onChange({ ...settings, replyTo: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="support@ticketwayz.com"
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={testing || !settings.host || !settings.username || !settings.password}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                testing || !settings.host || !settings.username || !settings.password
                  ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <SafeIcon icon={testing ? FiServer : FiMail} className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
              {testing ? 'Тестирование подключения...' : 'Тест подключения'}
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                <SafeIcon icon={testResult.success ? FiCheck : FiX} className="w-4 h-4" />
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Важные замечания
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Для Gmail используйте пароли приложений вместо основного пароля</li>
                  <li>• Убедитесь, что двухфакторная аутентификация настроена правильно</li>
                  <li>• Проверьте настройки безопасности вашего email провайдера</li>
                  <li>• Email отправителя должен быть подтвержден у провайдера</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default SMTPSettings;