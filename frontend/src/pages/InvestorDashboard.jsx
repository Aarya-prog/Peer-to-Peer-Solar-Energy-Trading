import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FiTrendingUp, FiDollarSign, FiAward, FiArrowRight, FiActivity, FiBriefcase, FiRefreshCw, FiGrid, FiList, FiLock, FiUnlock } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const InvestorDashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoReinvest, setAutoReinvest] = useState(false);

  // KYC States
  const [kycRecord, setKycRecord] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // KYC Form fields
  const [kycFullName, setKycFullName] = useState('');
  const [kycDob, setKycDob] = useState('');
  const [kycPanNumber, setKycPanNumber] = useState('');
  const [kycAadhaarNumber, setKycAadhaarNumber] = useState('');
  const [kycGstNumber, setKycGstNumber] = useState('');
  const [kycBankName, setKycBankName] = useState('');
  const [kycHolderName, setKycHolderName] = useState('');
  const [kycAccNumber, setKycAccNumber] = useState('');
  const [kycIfsc, setKycIfsc] = useState('');
  const [kycUpi, setKycUpi] = useState('');
  const [kycAddress, setKycAddress] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [identityProofFile, setIdentityProofFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);

  // Withdrawal States
  const [withdrawingIds, setWithdrawingIds] = useState({});

  // Payout & Deposit States
  const [userProfile, setUserProfile] = useState(null);
  const [simulatingPayouts, setSimulatingPayouts] = useState(false);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depCardName, setDepCardName] = useState('');
  const [depCardNumber, setDepCardNumber] = useState('');
  const [depCardExpiry, setDepCardExpiry] = useState('');
  const [depCardCvv, setDepCardCvv] = useState('');

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/investments/portfolio');
      if (res.data.success) {
        setPortfolio(res.data.data);
      }
      
      const kycRes = await api.get('/kyc/status');
      if (kycRes.data.success) {
        setKycRecord(kycRes.data.data);
      }

      const profileRes = await api.get('/users/profile');
      if (profileRes.data.success) {
        setUserProfile(profileRes.data.data);
        setAutoPayoutEnabled(profileRes.data.data.preferences?.autoPayoutEnabled || false);
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

  useEffect(() => {
    let intervalId;
    if (autoPayoutEnabled) {
      const runAutoPayoutSilent = async () => {
        try {
          const res = await api.post('/investments/simulate-payouts');
          if (res.data.success && res.data.totalPayoutAmount > 0) {
            toast.success(`Auto-Payout Credited: +₹${res.data.totalPayoutAmount.toLocaleString('en-IN')}`);
            fetchPortfolio();
          }
        } catch (err) {
          console.error('Silent auto payout simulation failed:', err);
        }
      };

      // Run immediately when enabled or loaded
      runAutoPayoutSilent();
      
      // Periodically run simulation every 10 seconds to simulate time progression
      intervalId = setInterval(runAutoPayoutSilent, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoPayoutEnabled]);

  const handleToggleAutoPayout = async () => {
    const nextVal = !autoPayoutEnabled;
    setAutoPayoutEnabled(nextVal);
    try {
      await api.put('/users/profile', {
        preferences: { autoPayoutEnabled: nextVal }
      });
      toast.success(nextVal ? 'Auto-Payout simulation active! Returns will credit automatically.' : 'Auto-Payout simulation disabled.');
    } catch (err) {
      toast.error('Failed to update Auto-Payout settings');
      setAutoPayoutEnabled(!nextVal);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!profilePhotoFile && (!kycRecord || !kycRecord.profilePhoto)) {
      return toast.error('Please upload your profile photo');
    }
    if (!identityProofFile && (!kycRecord || !kycRecord.identityProof)) {
      return toast.error('Please upload identity proof');
    }
    if (!addressProofFile && (!kycRecord || !kycRecord.addressProof)) {
      return toast.error('Please upload address proof');
    }

    setSubmittingKyc(true);
    const toastLoader = toast.loading('Uploading documents and submitting KYC...');
    try {
      const formData = new FormData();
      formData.append('fullName', kycFullName);
      formData.append('dob', kycDob);
      formData.append('panNumber', kycPanNumber);
      formData.append('aadhaarNumber', kycAadhaarNumber);
      formData.append('gstNumber', kycGstNumber);
      formData.append('bankName', kycBankName);
      formData.append('accountHolderName', kycHolderName);
      formData.append('accountNumber', kycAccNumber);
      formData.append('ifscCode', kycIfsc);
      formData.append('upiId', kycUpi);
      formData.append('address', kycAddress);

      if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
      if (identityProofFile) formData.append('identityProof', identityProofFile);
      if (addressProofFile) formData.append('addressProof', addressProofFile);

      const res = await api.post('/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        toast.success('KYC details submitted successfully! Status is now Pending Review.', { id: toastLoader });
        setKycModalOpen(false);
        fetchPortfolio();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Submission failed', { id: toastLoader });
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleSimulatePayouts = async () => {
    setSimulatingPayouts(true);
    const toastLoader = toast.loading('Simulating periodic interest auto payouts...');
    try {
      const res = await api.post('/investments/simulate-payouts');
      if (res.data.success) {
        toast.success(res.data.message, { id: toastLoader });
        fetchPortfolio();
      }
    } catch (err) {
      toast.error('Simulation failed', { id: toastLoader });
    } finally {
      setSimulatingPayouts(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      return toast.error('Please enter a valid deposit amount');
    }
    setDepositing(true);
    const toastLoader = toast.loading('Authorizing payment secure deposit...');
    try {
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: amt,
        type: 'Deposit',
        referenceId: 'wallet_deposit',
      });

      if (!intentRes.data.success) throw new Error('Deposit checkout initiation failed');
      const { checkoutId, signature } = intentRes.data.data;

      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: 'Credit Card',
        cardDetails: {
          name: depCardName,
          number: depCardNumber,
          expiry: depCardExpiry,
          cvv: depCardCvv,
        }
      });

      if (verifyRes.data.success) {
        toast.success(`Successfully deposited ₹${amt.toLocaleString('en-IN')} to your wallet balance!`, { id: toastLoader });
        setDepositModalOpen(false);
        setDepositAmount('');
        fetchPortfolio();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Deposit failed', { id: toastLoader });
    } finally {
      setDepositing(false);
    }
  };

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
          (portfolio?.portfolioValue || 0) * 0.95,
          portfolio?.portfolioValue || 0,
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investor Portfolio</h2>
          <p className="text-sm text-slate-400 mt-1">Manage crowdfunded assets, track lockups, and trigger auto payouts.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Wallet Balance widget */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-xs flex items-center gap-3">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Wallet Balance</p>
              <p className="font-extrabold text-brand-emerald text-sm">₹{userProfile?.data?.balance?.toLocaleString('en-IN') || userProfile?.balance?.toLocaleString('en-IN') || '0.00'}</p>
            </div>
            <button
              onClick={() => setDepositModalOpen(true)}
              className="bg-brand text-white px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-brand-dark transition-all"
            >
              + Deposit
            </button>
          </div>

          {/* Simulate auto payout button */}
          <button
            onClick={handleSimulatePayouts}
            disabled={simulatingPayouts || autoPayoutEnabled}
            className="bg-brand/10 border border-brand/20 hover:bg-brand hover:text-white text-brand px-4 py-2.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {simulatingPayouts ? 'Calculating Payouts...' : (autoPayoutEnabled ? 'Auto-Payout Active' : 'Simulate Payouts')}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold ${tier.color}`}>
            <FiAward className="text-lg" />
            <span>Investor Tier: {tier.name}</span>
          </div>
        </div>
      </div>

      {/* KYC Warning Banner */}
      {(!kycRecord || kycRecord.status !== 'Verified') && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1.5">
              <span>⚠️</span> Mandatory KYC Verification Required
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {kycRecord?.status === 'Pending'
                ? 'Your submitted KYC documents are under review by administrators. We will notify you once approved.'
                : kycRecord?.status === 'Rejected'
                ? `Your KYC submission was rejected: "${kycRecord.rejectionReason}". Please resubmit corrected documents.`
                : 'Complete your identity verification (KYC) to start investing and exploring solar crowd projects.'}
            </p>
          </div>
          {(!kycRecord || kycRecord.status === 'Rejected') && (
            <button
              onClick={() => {
                if (kycRecord) {
                  setKycFullName(kycRecord.fullName);
                  setKycDob(kycRecord.dob ? kycRecord.dob.substring(0, 10) : '');
                  setKycPanNumber(kycRecord.panNumber);
                  setKycAadhaarNumber(kycRecord.aadhaarNumber);
                  setKycGstNumber(kycRecord.gstNumber);
                  setKycBankName(kycRecord.bankName);
                  setKycHolderName(kycRecord.accountHolderName);
                  setKycAccNumber(kycRecord.accountNumber);
                  setKycIfsc(kycRecord.ifscCode);
                  setKycUpi(kycRecord.upiId || '');
                  setKycAddress(kycRecord.address);
                }
                setKycModalOpen(true);
              }}
              className="bg-brand text-white px-4 py-2 rounded-2xl text-xs font-bold hover:bg-brand-dark transition-all flex-shrink-0"
            >
              {kycRecord?.status === 'Rejected' ? 'Resubmit KYC' : 'Complete KYC'}
            </button>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Capital Invested</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.totalInvested.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
            <FiDollarSign />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Current Portfolio</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              ₹{portfolio?.portfolioValue.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg">
            <FiTrendingUp />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Accrued Profit (ROI)</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              +₹{portfolio?.totalProfit.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-lg">
            <FiAward />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Next Maturity</p>
            <p className="text-sm font-black text-slate-800 dark:text-white truncate">
              {portfolio?.nextMaturityDate ? new Date(portfolio.nextMaturityDate).toLocaleDateString() : 'No active locks'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg">
            <FiLock />
          </div>
        </div>
      </div>

      {/* Charts & Payout Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity /> Investment Portfolio Value
            </h3>
            <span className="text-xs font-semibold text-slate-400">Yield Growth</span>
          </div>
          <div className="h-64 flex items-center">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Crowdfunding Payouts</h3>
            <p className="text-xs text-slate-400 mb-4">
              Funds are held securely under a lock-in period matching your selected project duration. Lock countdown status is listed in the holding register below.
            </p>
            <Link
              to="/investments/projects"
              className="w-full flex justify-center items-center gap-2 rounded-2xl bg-brand py-3 text-xs font-bold text-white hover:bg-brand-dark transition-all shadow-sm"
            >
              <span>Invest in New Projects</span> <FiArrowRight />
            </Link>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
            {/* Auto-Payout Toggle */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Auto-Payout</h4>
                <p className="text-[10px] text-slate-400">Credit ROI payouts automatically as per cycle</p>
              </div>
              <button
                onClick={handleToggleAutoPayout}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  autoPayoutEnabled ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPayoutEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Reinvest Toggle */}
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-900 pt-3">
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
        </div>
      </div>

      {/* Recent Holdings Summary */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiGrid className="text-brand" />
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Holdings Summary</h3>
          </div>
          <Link
            to="/investor/portfolio"
            className="text-xs text-brand hover:underline font-bold"
          >
            View All Assets →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Solar Project</th>
                <th className="px-6 py-4">Plan Duration</th>
                <th className="px-6 py-4">Principal Amount</th>
                <th className="px-6 py-4">Maturity Date</th>
                <th className="px-6 py-4">Lock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {!portfolio?.investmentsList || portfolio.investmentsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    No holdings found in your portfolio.
                  </td>
                </tr>
              ) : (
                portfolio.investmentsList.slice(0, 3).map((inv) => {
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{inv.project?.name}</td>
                      <td className="px-6 py-4 text-slate-400">{inv.durationMonths} Months Plan</td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(inv.maturityDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 w-fit ${
                            inv.status === 'Locked' || inv.status === 'Active'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                              : inv.status === 'Matured'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
                          }`}
                        >
                          {inv.status === 'Locked' || inv.status === 'Active' ? (
                            <>
                              <FiLock className="text-[10px]" /> Locked
                            </>
                          ) : inv.status === 'Matured' ? (
                            <>
                              <FiUnlock className="text-[10px]" /> Matured
                            </>
                          ) : (
                            'Withdrawn'
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Submission Form Modal */}
      <Modal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} title="Complete Investor KYC Verification">
        <form onSubmit={handleKycSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
          <div className="bg-brand/5 border border-brand/10 p-4 rounded-2xl text-xs text-slate-500">
            Mandatory KYC is required under Indian regulations to participate in solar project crowdfunding plans. Please ensure all details match your official documents.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">FULL NAME (As on PAN/Aadhaar)</label>
              <input
                type="text"
                required
                value={kycFullName}
                onChange={(e) => setKycFullName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">DATE OF BIRTH</label>
              <input
                type="date"
                required
                value={kycDob}
                onChange={(e) => setKycDob(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">PAN CARD NUMBER</label>
              <input
                type="text"
                required
                maxLength="10"
                value={kycPanNumber}
                onChange={(e) => setKycPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">AADHAAR NUMBER</label>
              <input
                type="text"
                required
                maxLength="12"
                value={kycAadhaarNumber}
                onChange={(e) => setKycAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">GST NUMBER (Optional)</label>
              <input
                type="text"
                value={kycGstNumber}
                onChange={(e) => setKycGstNumber(e.target.value.toUpperCase())}
                placeholder="GSTIN Code"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Payout Bank Account Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">BANK NAME</label>
                <input
                  type="text"
                  required
                  value={kycBankName}
                  onChange={(e) => setKycBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ACCOUNT HOLDER NAME</label>
                <input
                  type="text"
                  required
                  value={kycHolderName}
                  onChange={(e) => setKycHolderName(e.target.value)}
                  placeholder="As in bank records"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ACCOUNT NUMBER</label>
                <input
                  type="text"
                  required
                  value={kycAccNumber}
                  onChange={(e) => setKycAccNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Bank Account Number"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">IFSC CODE</label>
                <input
                  type="text"
                  required
                  value={kycIfsc}
                  onChange={(e) => setKycIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000123"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-slate-400 block mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                value={kycUpi}
                onChange={(e) => setKycUpi(e.target.value)}
                placeholder="username@bank"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">RESIDENTIAL ADDRESS</label>
              <textarea
                required
                rows="2"
                value={kycAddress}
                onChange={(e) => setKycAddress(e.target.value)}
                placeholder="Full Street Address, City, State & Zip Code"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* File Verification Uploads */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">File Verification Uploads</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">PROFILE PHOTO (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.profilePhoto && !profilePhotoFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current profile photo</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">IDENTITY PROOF (Aadhaar / PAN Card Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdentityProofFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.identityProof && !identityProofFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current identity proof</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ADDRESS PROOF (Utility Bill Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddressProofFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.addressProof && !addressProofFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current address proof</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingKyc}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-xs font-bold text-white transition-all disabled:opacity-50 mt-4 shadow-md"
          >
            {submittingKyc ? 'Submitting KYC application...' : 'Submit KYC Details'}
          </button>
        </form>
      </Modal>

      {/* Wallet Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit Funds to Wallet">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl text-[11px] text-slate-500">
            Top up your wallet balance instantly using card checkout simulations. Added balance can be used for crowdfunding projects.
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">DEPOSIT VALUE (₹)</label>
            <input
              type="number"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">CARDHOLDER NAME</label>
            <input
              type="text"
              required
              value={depCardName}
              onChange={(e) => setDepCardName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">CARD NUMBER</label>
            <input
              type="text"
              required
              value={depCardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                const parts = [];
                for (let i = 0; i < val.length; i += 4) {
                  parts.push(val.substring(i, i + 4));
                }
                setDepCardNumber(parts.length > 0 ? parts.join(' ') : val);
              }}
              placeholder="4111 2222 3333 4444"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">EXPIRY DATE</label>
              <input
                type="text"
                required
                value={depCardExpiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                  if (val.length >= 2) {
                    val = `${val.substring(0, 2)}/${val.substring(2)}`;
                  }
                  setDepCardExpiry(val);
                }}
                placeholder="MM/YY"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">CVV</label>
              <input
                type="password"
                required
                value={depCardCvv}
                onChange={(e) => setDepCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                placeholder="•••"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={depositing}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3 text-xs font-bold text-white transition-all disabled:opacity-50 mt-2 shadow-md"
          >
            {depositing ? 'Authorizing deposit transaction...' : 'Deposit Funds'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default InvestorDashboard;
