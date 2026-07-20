import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { FiTrendingUp, FiDollarSign, FiAward, FiArrowRight, FiActivity, FiBriefcase, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const InvestorDashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoReinvest, setAutoReinvest] = useState(false);

  // Withdrawal States
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/investments/portfolio');
      if (res.data.success) {
        setPortfolio(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load portfolio details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      return toast.error('Please enter a valid payout amount');
    }

    setWithdrawing(true);
    try {
      const res = await api.post('/investments/withdraw', { amount: amt });
      if (res.data.success) {
        toast.success(res.data.message);
        setWithdrawModalOpen(false);
        setWithdrawAmount('');
        fetchPortfolio();
      }
    } catch (err) {
      toast.error(err.message || 'Payout simulation failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleToggleReinvest = () => {
    const nextVal = !autoReinvest;
    setAutoReinvest(nextVal);
    toast.success(nextVal ? 'Auto-Reinvest enabled! Accrued ROI will be auto-allocated.' : 'Auto-Reinvest disabled.');
  };

  if (loading) return <Spinner />;

  // Investor Tier Calculator
  const totalInvested = portfolio?.totalInvested || 0;
  const getInvestorTier = (total) => {
    if (total >= 500000) return { name: 'Platinum Green Shield', color: 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-850 dark:text-indigo-400' };
    if (total >= 200000) return { name: 'Gold Emerald Shield', color: 'bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-850 dark:text-amber-400' };
    if (total >= 50000) return { name: 'Silver Leaf', color: 'bg-slate-100/50 border-slate-200 text-slate-700 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-400' };
    return { name: 'Bronze Sprout', color: 'bg-orange-50/50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-850 dark:text-orange-400' };
  };
  const tier = getInvestorTier(totalInvested);

  // Chart configuration
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value (₹)',
        data: [
          totalInvested * 0.8,
          totalInvested * 0.9,
          totalInvested,
          (portfolio?.totalCurrentValue || 0) * 0.95,
          portfolio?.totalCurrentValue || 0,
        ],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
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
      y: { grid: { color: 'rgba(0,0,0,0.02)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10 p-4 sm:p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner and Tier Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investor Portfolio</h2>
          <p className="text-sm text-slate-400 mt-1">Manage crowdfunded assets, simulate cashouts, and monitor return yields.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${tier.color}`}>
          <FiAward className="text-lg" />
          <span>Investor Tier: {tier.name}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Capital Invested</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.totalInvested.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
            <FiDollarSign />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Current Valuation</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.totalCurrentValue.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl">
            <FiTrendingUp />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Profit (ROI)</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              +₹{portfolio?.totalROIRealized.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-xl">
            <FiAward />
          </div>
        </div>
      </div>

      {/* Charts & Payout Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity /> Investment Growth
            </h3>
            <span className="text-xs font-semibold text-slate-400">Monthly Returns</span>
          </div>
          <div className="h-64 flex items-center">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Simulate Cashout</h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit a simulated transfer payout request to withdraw accrued dividend earnings to your wallet balance.
            </p>
            <button
              onClick={() => setWithdrawModalOpen(true)}
              className="w-full rounded-2xl bg-brand py-3 text-xs font-bold text-white hover:bg-brand-dark transition-all"
            >
              Request Withdrawal
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Auto-Reinvest</h4>
                <p className="text-[10px] text-slate-400">Reinvest returns into new solar field arrays</p>
              </div>
              <button
                onClick={handleToggleReinvest}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  autoReinvest ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoReinvest ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <Link to="/investments/projects" className="text-xs font-bold text-brand hover:underline flex items-center gap-1 mt-4">
            Invest in new Projects <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Portfolio Holdings Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FiGrid className="text-brand" />
          <h3 className="font-bold text-slate-800 dark:text-white">Active Crowdfund Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Solar Project</th>
                <th className="px-6 py-4">Expected ROI</th>
                <th className="px-6 py-4">Total Principal</th>
                <th className="px-6 py-4">Current Value</th>
                <th className="px-6 py-4">Project Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {portfolio?.breakdown.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    No active investments in portfolio.
                  </td>
                </tr>
              ) : (
                portfolio?.breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 font-semibold">{item.projectName}</td>
                    <td className="px-6 py-4 text-brand">{item.roi}%</td>
                    <td className="px-6 py-4 font-bold">₹{item.invested.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-bold text-brand-emerald">₹{item.currentValue.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          item.status === 'Operational'
                            ? 'bg-green-150 text-green-750 dark:bg-green-950/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Transactions Ledger */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FiList className="text-brand" />
          <h3 className="font-bold text-slate-800 dark:text-white">Investment Transactions Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Share Units</th>
                <th className="px-6 py-4">Contribution Value</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {!portfolio?.investmentsList || portfolio.investmentsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    No transactions logs found.
                  </td>
                </tr>
              ) : (
                portfolio.investmentsList.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{inv._id}</td>
                    <td className="px-6 py-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold">{inv.sharesOwned} Shares</td>
                    <td className="px-6 py-4 font-bold text-brand">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-bold">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal request modal */}
      <Modal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} title="Request Payout Transfer">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">WITHDRAWAL AMOUNT (₹)</label>
            <input
              type="number"
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={withdrawing}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
          >
            {withdrawing ? 'Processing payout...' : 'Request Payout'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default InvestorDashboard;
