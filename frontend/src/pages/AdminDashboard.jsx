import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { FiUsers, FiDollarSign, FiZap, FiBriefcase, FiArrowRight, FiActivity } from 'react-icons/fi';
import { Spinner } from '../components/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) return <Spinner />;

  // Chart configs
  const chartData = {
    labels: stats?.revenueChart.map((c) => c.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Platform Revenue (₹)',
        data: stats?.revenueChart.map((c) => c.revenue) || [1000, 2000, 3000, 4000, 5000, 6000],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.03)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10 p-4 sm:p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* macOS window dots */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-3 h-3 rounded-full bg-red-400 block hover:opacity-80 transition-opacity cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 block hover:opacity-80 transition-opacity cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-green-400 block hover:opacity-80 transition-opacity cursor-pointer" />
      </div>
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Platform Users</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{stats?.metrics.totalUsers || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-lg">
            <FiUsers />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Gross Revenue</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              ₹{stats?.metrics.totalRevenue.toFixed(2) || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
            <FiDollarSign />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Solar Generated</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {stats?.metrics.energyGenerated || 0} MWh
            </p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-lg">
            <FiZap />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Field Investments</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              ₹{stats?.metrics.totalInvested.toLocaleString() || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-lg">
            <FiBriefcase />
          </div>
        </div>
      </div>

      {/* Main Charts & Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity /> Monthly Platform Revenue
            </h3>
            <span className="text-xs font-semibold text-slate-400">Total earnings</span>
          </div>
          <div className="h-64 flex items-center">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Admin Navigation Drawer Links */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass space-y-4">
          <h3 className="text-sm font-bold">Admin Controls</h3>
          <div className="flex flex-col gap-2.5">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-brand/10 transition-all text-xs font-semibold text-slate-600 dark:text-slate-200"
            >
              <span>Manage Platform Users</span> <FiArrowRight />
            </Link>
            <Link
              to="/admin/projects"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-brand/10 transition-all text-xs font-semibold text-slate-600 dark:text-slate-200"
            >
              <span>Manage Crowdfund Projects</span> <FiArrowRight />
            </Link>
            <Link
              to="/admin/installations"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-brand/10 transition-all text-xs font-semibold text-slate-600 dark:text-slate-200"
            >
              <span>Installation Tracker</span> <FiArrowRight />
            </Link>
            <Link
              to="/admin/support"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-brand/10 transition-all text-xs font-semibold text-slate-600 dark:text-slate-200"
            >
              <span>Pending Support Tickets</span> <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white">Recent Solar Installations</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/20 dark:bg-slate-900/20">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Request Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {stats?.recentInstallations.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                  No active installations.
                </td>
              </tr>
            ) : (
              stats?.recentInstallations.map((inst) => (
                <tr key={inst._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4 font-semibold">{inst.user.name}</td>
                  <td className="px-6 py-4">{inst.panelCapacityKw} kW</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-brand/5 border border-brand/20 px-2 py-0.5 text-xs font-bold text-brand-dark dark:text-brand-lime">
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(inst.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
