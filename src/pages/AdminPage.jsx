import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiCalendar, FiDollarSign, FiTrendingUp, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { events } from '../assets/mockData';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Моковые данные для админки
  const stats = {
    users: 1245,
    events: events.length,
    revenue: 15680,
    growth: 24.5
  };

  // Моковые данные для последних заказов
  const recentOrders = [
    { id: 'ORD-8742', user: 'Алексей С.', event: 'MAX KORZH', date: '2023-05-15', amount: 300 },
    { id: 'ORD-8741', user: 'Мария К.', event: 'DVIZH ТУСА', date: '2023-05-15', amount: 160 },
    { id: 'ORD-8740', user: 'Иван П.', event: 'Bustour Berlin-Warsaw-Berlin', date: '2023-05-14', amount: 120 },
    { id: 'ORD-8739', user: 'Елена Т.', event: 'MAX KORZH', date: '2023-05-14', amount: 300 },
    { id: 'ORD-8738', user: 'Дмитрий К.', event: 'Bustour Riga-Warsaw-Riga', date: '2023-05-14', amount: 80 }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: FiTrendingUp },
    { id: 'events', label: 'События', icon: FiCalendar },
    { id: 'orders', label: 'Заказы', icon: FiDollarSign },
    { id: 'users', label: 'Пользователи', icon: FiUsers },
    { id: 'settings', label: 'Настройки', icon: FiUsers },
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
              {menuItems.find(item => item.id === activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold">
              {menuItems.find(item => item.id === activeTab)?.label || 'Дашборд'}
            </h1>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Последние заказы</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zinc-600 dark:text-zinc-400 text-sm">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Пользователь</th>
                          <th className="pb-3">Событие</th>
                          <th className="pb-3">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id} className="border-t border-zinc-200 dark:border-zinc-700">
                            <td className="py-3 text-sm">{order.id}</td>
                            <td className="py-3">{order.user}</td>
                            <td className="py-3 text-sm">{order.event}</td>
                            <td className="py-3 font-medium">{order.amount} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-yellow-500 hover:underline text-sm">
                      Посмотреть все заказы
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Популярные события</h3>
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event, index) => (
                      <div key={event.id} className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{event.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {Math.floor(Math.random() * 100) + 50} продаж
                          </div>
                          <div className="text-sm text-green-500">
                            +{Math.floor(Math.random() * 30)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-yellow-500 hover:underline text-sm">
                      Посмотреть все события
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'dashboard' && (
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
    </div>
  );
};

export default AdminPage;