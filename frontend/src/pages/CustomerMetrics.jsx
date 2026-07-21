import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FiTrendingUp, FiZap, FiAward, FiActivity, FiGlobe } from 'react-icons/fi';
import { Spinner } from '../components/Loader';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerMetrics = () => {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/users/metrics/analysis');
      if (res.data.success) {
        setMetricsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load metrics analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <Spinner />;

  // Chart configuration
  const chartData = {
    labels: metricsData?.monthlyLogs.map((l) => l.month) || [],
    datasets: [
      {
        label: 'Solar P2P Clean energy (kWh)',
        data: metricsData?.monthlyLogs.map((l) => l.solarKwh) || [],
        backgroundColor: '#22c55e',
        borderRadius: 8,
      },
      {
        label: 'Conventional Utility Grid (kWh)',
        data: metricsData?.monthlyLogs.map((l) => l.utilityKwh) || [],
        backgroundColor: '#94a3b8',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 10, weight: 'bold' } },
      },
    },
    scales: {
      y: { stacked: true, grid: { color: 'rgba(0,0,0,0.02)' } },
      x: { stacked: true, grid: { display: false } },
    },
  };

  const summary = metricsData?.summary;

  return (
    <div className="space-y-6 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10 p-4 sm:p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Clean Energy Metrics &amp; Analytics</h2>
        <p className="text-sm text-slate-400 mt-1">Analyze clean energy vs utility power distributions, and review carbon footprints.</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Carbon Offset Saved</p>
            <p className="text-2xl font-black text-brand-emerald">
              {summary?.carbonOffsetKg} kg CO2
            </p>
            <p className="text-[9px] text-slate-400">Greenhouse gas emission prevented.</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
            <FiGlobe />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Tree Plantings Equivalent</p>
            <p className="text-2xl font-black text-brand">
              {summary?.treeEquivalent} Trees
            </p>
            <p className="text-[9px] text-slate-400">Carbon absorption equivalent.</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg">
            <FiAward />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Peak Load Demand</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {summary?.peakLoadKw} kW
            </p>
            <p className="text-[9px] text-slate-400">Highest energy spike recorded.</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg">
            <FiZap />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Clean Energy Share</p>
            <p className="text-2xl font-black text-brand-emerald">
              {summary?.solarRatioPercent}%
            </p>
            <p className="text-[9px] text-slate-400">Solar P2P vs Conventional ratio.</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-lg">
            <FiTrendingUp />
          </div>
        </div>
      </div>

      {/* Grid: Bar Chart & Data Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity /> Monthly Energy Distribution
            </h3>
            <span className="text-xs font-semibold text-slate-450">Solar P2P vs Utility Grid</span>
          </div>
          <div className="h-64 flex items-center">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Metrics Summary</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your solar node automatically routes surplus grid power from neighbor solar arrays, prioritizing local clean sources over conventional coal-based grids.
            </p>
            <div className="space-y-3 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex justify-between">
                <span>Average Daily Use:</span>
                <span className="font-bold text-slate-800 dark:text-white">{summary?.averageDailyKwh} kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Current Month Total:</span>
                <span className="font-bold text-slate-800 dark:text-white">380 kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Monthly Savings:</span>
                <span className="font-bold text-brand">₹760.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Data Ledger */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FiActivity className="text-brand" />
          <h3 className="font-bold text-slate-800 dark:text-white">Historical Energy Consumption Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Billing Month</th>
                <th className="px-6 py-4">Total Consumption</th>
                <th className="px-6 py-4">Solar P2P Usage</th>
                <th className="px-6 py-4">Utility Grid Usage</th>
                <th className="px-6 py-4 text-right">Bill Settle Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {metricsData?.monthlyLogs.map((log) => (
                <tr key={log.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4 font-bold">{log.month}</td>
                  <td className="px-6 py-4 font-semibold">{log.consumptionKwh} kWh</td>
                  <td className="px-6 py-4 text-brand font-medium">{log.solarKwh} kWh</td>
                  <td className="px-6 py-4 text-slate-400">{log.utilityKwh} kWh</td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-800 dark:text-white">
                    ₹{log.billAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerMetrics;
