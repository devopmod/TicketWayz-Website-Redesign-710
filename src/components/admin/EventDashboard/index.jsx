import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../common/SafeIcon';
import AdminNavBar from '../AdminNavBar';
import PricingModal from './PricingModal';
import SeatStatusManager from './SeatStatusManager';
import {
  fetchEventById,
  getEventStatistics,
  initializeRealtimeSubscription,
  regenerateEventSeats
} from '../../../services/eventService';
import supabase from '../../../lib/supabase';

const {
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiPieChart,
  FiRefreshCw,
  FiArrowLeft
} = FiIcons;

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState(false);
  const [regeneratingSeats, setRegeneratingSeats] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      try {
        setLoading(true);
        const eventData = await fetchEventById(id);
        setEvent(eventData);
        const stats = await getEventStatistics(id);
        setStatistics(stats);
      } catch (err) {
        console.error('Error loading event dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    const handlePricesUpdate = async () => {
      try {
        const updated = await fetchEventById(id);
        setEvent(updated);
      } catch (err) {
        console.error('Error updating prices:', err);
      }
    };

    const handleTicketsChange = async () => {
      try {
        const stats = await getEventStatistics(id);
        setStatistics(stats);
      } catch (err) {
        console.error('Error updating statistics:', err);
      }
    };

    loadData();
    unsubscribe = initializeRealtimeSubscription(id, handlePricesUpdate, handleTicketsChange);

    const interval = setInterval(() => {
      const connected = supabase.getChannels().length > 0;
      setRealtimeStatus(connected);
    }, 5000);

    return () => {
      unsubscribe && unsubscribe();
      clearInterval(interval);
    };
  }, [id]);

  const handleRegenerateSeats = async () => {
    try {
      setRegeneratingSeats(true);
      const stats = await regenerateEventSeats(id);
      setStatistics(stats);
    } catch (err) {
      console.error('Error regenerating seats:', err);
    } finally {
      setRegeneratingSeats(false);
    }
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      }).format(value || 0);
    } catch {
      return `€${Number(value || 0).toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-600 dark:text-zinc-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <AdminNavBar title={event?.title} />
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
        >
          <SafeIcon icon={FiArrowLeft} className="mr-2" />
          Назад
        </button>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-zinc-600 dark:text-zinc-400">Today's Sales</h3>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <SafeIcon icon={FiDollarSign} className="text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(statistics?.todaysSales)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-zinc-600 dark:text-zinc-400">Tickets Sold</h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <SafeIcon icon={FiShoppingBag} className="text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{statistics?.soldSeats || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-zinc-600 dark:text-zinc-400">Revenue</h3>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <SafeIcon icon={FiTrendingUp} className="text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(statistics?.estimatedRevenue)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-zinc-600 dark:text-zinc-400">Availability</h3>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <SafeIcon icon={FiPieChart} className="text-yellow-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {statistics ? `${statistics.freeSeats}/${statistics.totalSeats}` : '0/0'}
            </p>
          </motion.div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowPricingModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Edit Prices
          </button>
          <button
            onClick={handleRegenerateSeats}
            disabled={regeneratingSeats}
            className="flex items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded"
          >
            {regeneratingSeats && (
              <SafeIcon icon={FiRefreshCw} className="mr-2 animate-spin" />
            )}
            {regeneratingSeats ? 'Regenerating...' : 'Regenerate Seats'}
          </button>
        </div>

        {/* Real-time status block */}
        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Real-time Status</h3>
          <p className={realtimeStatus ? 'text-green-500' : 'text-red-500'}>
            {realtimeStatus ? 'Connected' : 'Disconnected'}
          </p>
        </div>

        <SeatStatusManager statistics={statistics} />
      </div>

      {showPricingModal && (
        <PricingModal
          event={event}
          onClose={() => setShowPricingModal(false)}
          onSave={(updated) => setEvent(prev => ({ ...prev, prices: updated }))}
        />
      )}
    </div>
  );
};

export default EventDashboard;

