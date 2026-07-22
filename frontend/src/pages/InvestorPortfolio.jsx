import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { FiBriefcase, FiLock, FiUnlock, FiFileText, FiArrowLeft, FiTrendingUp, FiAward, FiDollarSign } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

// Register ChartJS ArcElement for Doughnut Chart
ChartJS.register(ArcElement, Tooltip, Legend);

const InvestorPortfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingIds, setWithdrawingIds] = useState({});
  
  // Agreement Modal States
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);

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

  const handleWithdrawInvestment = async (investmentId) => {
    setWithdrawingIds((prev) => ({ ...prev, [investmentId]: true }));
    try {
      const res = await api.post(`/investments/withdraw/${investmentId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchPortfolio();
      }
    } catch (err) {
      toast.error(err.message || 'Withdrawal submission failed');
    } finally {
      setWithdrawingIds((prev) => ({ ...prev, [investmentId]: false }));
    }
  };

  const handleOpenAgreement = (agreement) => {
    if (!agreement) {
      toast.error('No signed agreement document found for this investment.');
      return;
    }
    setSelectedAgreement(agreement);
    setAgreementModalOpen(true);
  };

  if (loading) return <Spinner />;

  // Prepare Asset Allocation Data
  const investments = portfolio?.investmentsList || [];
  const projectAllocation = {};
  investments.forEach((inv) => {
    if (inv.project && inv.status !== 'Withdrawn') {
      const projName = inv.project.name;
      projectAllocation[projName] = (projectAllocation[projName] || 0) + inv.amount;
    }
  });

  const chartLabels = Object.keys(projectAllocation);
  const chartDataValues = Object.values(projectAllocation);

  const doughnutData = {
    labels: chartLabels.length > 0 ? chartLabels : ['No Active Assets'],
    datasets: [
      {
        data: chartDataValues.length > 0 ? chartDataValues : [1],
        backgroundColor: [
          '#10b981', // emerald
          '#14b8a6', // teal
          '#22c55e', // green
          '#84cc16', // lime
          '#06b6d4', // cyan
          '#059669', // dark emerald
          '#0d9488', // dark teal
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 10 },
          color: '#64748b',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (chartLabels.length === 0) return ' No active assets';
            const val = context.raw;
            return ` ₹${val.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div className="space-y-6 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10 p-4 sm:p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FiBriefcase className="text-brand" /> My Holdings & Assets
          </h2>
          <p className="text-sm text-slate-400 mt-1">Review active crowd-funding locks, signed legal contracts, and ROI distributions.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Principal Locked</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.totalInvested.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
            <FiDollarSign />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Valuation with Accrued ROI</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.portfolioValue.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg">
            <FiTrendingUp />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Realized ROI</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">
              +₹{portfolio?.totalProfit.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-lg">
            <FiAward />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Holdings table list */}
        <div className="glass-panel rounded-3xl shadow-glass overflow-hidden lg:col-span-2 border border-white/20 dark:border-slate-800/40">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Active Crowd-Funding Locks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Solar Farm / Capacity</th>
                  <th className="px-6 py-4">Capital Locked</th>
                  <th className="px-6 py-4">Maturity Countdown</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No active solar holdings found.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => {
                    const daysLeft = Math.max(0, Math.ceil((new Date(inv.maturityDate) - new Date()) / (1000 * 60 * 60 * 24)));
                    
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-white">{inv.project?.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{inv.durationMonths} Months Duration ({inv.project?.expectedROI}% Expected ROI)</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(inv.maturityDate).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-orange-500 font-bold mt-0.5">
                            {inv.status === 'Locked' || inv.status === 'Active' ? `${daysLeft} Days Left` : 'Unlocked'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 w-fit ${
                              inv.status === 'Locked' || inv.status === 'Active'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                                : inv.status === 'Matured'
                                ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
                            }`}
                          >
                            {inv.status === 'Locked' || inv.status === 'Active' ? (
                              <><FiLock className="text-[9px]" /> Locked</>
                            ) : inv.status === 'Matured' ? (
                              <><FiUnlock className="text-[9px]" /> Matured</>
                            ) : (
                              'Withdrawn'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-y-1.5">
                          {inv.status === 'Matured' ? (
                            <button
                              onClick={() => handleWithdrawInvestment(inv._id)}
                              disabled={withdrawingIds[inv._id]}
                              className="bg-brand text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-dark disabled:opacity-50 transition-all w-full sm:w-auto"
                            >
                              {withdrawingIds[inv._id] ? 'Withdrawing...' : 'Request Payout'}
                            </button>
                          ) : inv.status === 'Withdrawn' ? (
                            <div className="text-xs text-slate-400 font-bold pr-2">Withdrawn</div>
                          ) : (
                            <div className="text-xs text-slate-400 pr-2">Locked</div>
                          )}

                          <div>
                            <button
                              onClick={() => handleOpenAgreement(inv.agreement)}
                              className="text-[10px] text-brand hover:underline font-bold flex items-center gap-1 ml-auto w-fit"
                            >
                              <FiFileText /> View Contract
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset allocation charts */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between border border-white/20 dark:border-slate-800/40 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Asset Allocation</h3>
            <p className="text-xs text-slate-400">Capital distribution across different solar farm investments.</p>
          </div>

          <div className="relative h-48 w-full flex items-center justify-center">
            {chartLabels.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-slate-400 text-xs font-medium">No active holdings to display chart</div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>Total Active Projects:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {Object.keys(projectAllocation).length}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Average Expected Return:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">10.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Signed Agreement Modal */}
      <Modal
        isOpen={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        title="Investment Agreement & Legal Contract"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {selectedAgreement?.agreementText || 'Agreement document content details loading...'}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span>Signed By: </span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                {selectedAgreement?.legalNameSignature || 'Verified Investor'}
              </span>
            </div>
            <div>
              <span>Signed On: </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {selectedAgreement?.createdAt ? new Date(selectedAgreement.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setAgreementModalOpen(false)}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-xs font-bold text-white transition-all shadow-md mt-2"
          >
            Close Agreement Document
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default InvestorPortfolio;
