import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { FiZap, FiAward, FiPackage, FiActivity, FiArrowRight, FiDollarSign } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [installations, setInstallations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // KYC States
  const [kycRecord, setKycRecord] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
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

  // Buy States
  const [buyUnits, setBuyUnits] = useState('100');
  const [buySource, setBuySource] = useState('utility');

  const handleSelectCustomerType = async (type) => {
    try {
      const res = await api.put('/users/profile', { customerType: type });
      if (res.data.success) {
        toast.success(`Profile customized for ${type}!`);
        // Refresh local dashboard data
        const profileRes = await api.get('/users/profile');
        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }
        navigate('/marketplace');
      }
    } catch (err) {
      toast.error('Failed to configure energy profile category.');
    }
  };

  // Checkout states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState('Card'); // 'Card' or 'UPI'
  const [upiId, setUpiId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);

  // Deposit States
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depCardName, setDepCardName] = useState('');
  const [depCardNumber, setDepCardNumber] = useState('');
  const [depCardExpiry, setDepCardExpiry] = useState('');
  const [depCardCvv, setDepCardCvv] = useState('');

  const fetchDashboardData = async () => {
    try {
      const profileRes = await api.get('/users/profile');
      const subRes = await api.get('/subscriptions/active/current');
      const instRes = await api.get('/installations/my-requests');
      const tradesRes = await api.get('/marketplace/trades');

      try {
        const kycRes = await api.get('/kyc/status');
        if (kycRes.data.success) {
          setKycRecord(kycRes.data.data);
        }
      } catch (kErr) {
        // ignore
      }

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        const userId = profileRes.data.data.user._id;
        if (tradesRes.data.success) {
          setPurchases(tradesRes.data.data.filter(t => t.buyer?._id === userId || t.buyer === userId));
        }
      }
      if (subRes.data.success) setSubscription(subRes.data.data);
      if (instRes.data.success) setInstallations(instRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'KYC submission failed', { id: toastLoader });
    } finally {
      setSubmittingKyc(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInitiateBuy = (e) => {
    e.preventDefault();
    const units = parseFloat(buyUnits);
    if (isNaN(units) || units <= 0) {
      toast.error('Please enter valid energy units to buy');
      return;
    }
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setUpiId('');
    setSelectedPayMethod('Card');
    setCheckoutModalOpen(true);
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.length > 0 ? parts.join(' ') : val);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(val);
  };

  const handleDashboardPurchase = async (e) => {
    e.preventDefault();
    const units = parseFloat(buyUnits);
    const rate = buySource === 'utility' ? 6.5 : 7.0;
    const totalCost = units * rate;

    if (selectedPayMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      return toast.error('Please enter a valid UPI ID (e.g. username@bank)');
    }

    setPaying(true);
    const toastLoader = toast.loading('Initiating SolarPay connection...');
    try {
      // 1. Create payment intent
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: totalCost,
        type: 'EnergyTrade',
        referenceId: profile.user._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway connection rejected');
      const { checkoutId, signature } = intentRes.data.data;

      // 2. Verify signature
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: selectedPayMethod === 'Card' ? 'Card' : 'UPI',
        cardDetails: selectedPayMethod === 'Card' ? {
          name: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
        } : null,
        upiId: selectedPayMethod === 'UPI' ? upiId : undefined
      });

      if (verifyRes.data.success) {
        // 3. Log trade
        await api.post('/marketplace/buy-direct', {
          plantId: profile.user._id,
          unitsKwh: units,
          ratePerUnit: rate,
          totalAmount: totalCost,
        });

        toast.success(`Successfully purchased ${units} kWh of clean energy!`, { id: toastLoader });
        setCheckoutModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Payment failed', { id: toastLoader });
    } finally {
      setPaying(false);
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
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Deposit failed', { id: toastLoader });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <Spinner />;

  // Chart configuration
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Energy Consumed (kWh)',
        data: [280, 310, 290, 340, 320, 380],
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

  const latestInstall = installations[installations.length - 1];

  const getStatusColor = (status) => {
    return {
      Request: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400',
      'Site Inspection': 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400',
      Quotation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400',
      'Engineer Assignment': 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400',
      Installation: 'bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400',
      Completed: 'bg-brand/10 text-brand dark:bg-green-950/20 dark:text-brand-lime',
    }[status] || 'bg-slate-100 text-slate-800';
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

      {/* KYC Verification Status Banner */}
      {profile?.user?.role !== 'Admin' && (!kycRecord || kycRecord.status !== 'Verified') && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
          <div className="text-xs text-slate-550 dark:text-slate-400">
            <span className="font-bold text-amber-700 dark:text-amber-400">KYC Verification Required:</span>{' '}
            {kycRecord?.status === 'Pending' ? (
              <span>Your ID details have been submitted and are under review by administrators. Verification is pending.</span>
            ) : kycRecord?.status === 'Rejected' ? (
              <span>Your identity application was rejected. Reason: <strong className="text-red-500">{kycRecord.rejectionReason || 'Documents mismatch'}</strong>. Please click to update and resubmit.</span>
            ) : (
              <span>Identity verification is mandatory to buy green energy from the local P2P neighborhood marketplace.</span>
            )}
          </div>
          {kycRecord?.status !== 'Pending' && (
            <button
              onClick={() => {
                setKycFullName(profile?.user.name || '');
                setKycModalOpen(true);
              }}
              className="rounded-full bg-amber-550 hover:bg-amber-600 text-white px-4 py-1.5 text-[10px] font-bold tracking-wide transition-all uppercase whitespace-nowrap"
            >
              Verify My ID
            </button>
          )}
        </div>
      )}

      {/* Welcome banner */}
      <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {profile?.user.name}!</h2>
          <p className="text-sm text-slate-400 mt-1">Check out your smart meter activity and clean power logs.</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase">Wallet Balance</p>
            <p className="text-2xl font-black text-brand-emerald">
              ₹{profile?.balance?.toFixed(2) || '0.00'}
            </p>
            <button
              onClick={() => setDepositModalOpen(true)}
              className="text-[10px] font-bold text-brand hover:underline block text-right mt-1 w-full"
            >
              + Add Funds
            </button>
          </div>
          <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-6">
            <p className="text-xs font-semibold text-slate-400 uppercase">Rewards Points</p>
            <p className="text-2xl font-black text-brand flex items-center justify-end gap-1">
              <FiAward /> {profile?.rewardPoints || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Energy Consumed */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Current Month Use</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">380 kWh</p>
            <p className="text-[10px] text-red-500 font-bold">↑ 8% from last month</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl">
            <FiZap />
          </div>
        </div>

        {/* Card 2: Active Plan */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Active Subscription</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
              {subscription ? subscription.plan.name : 'No Active Plan'}
            </p>
            <p className="text-xs text-slate-400">
              {subscription ? `₹${subscription.plan.ratePerUnit}/kWh Fixed` : 'Tap to subscribe'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center text-xl">
            <FiPackage />
          </div>
        </div>

        {/* Card 3: Badges */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Carbon Achievements</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {profile?.badges && profile.badges.length > 0 ? (
                profile.badges.map((b) => (
                  <span key={b} className="rounded-full bg-brand/5 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand-dark dark:text-brand-lime">
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No achievements yet</span>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-xl">
            <FiAward />
          </div>
        </div>
      </div>

      {/* Main Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity /> Electricity Consumption
            </h3>
            <span className="text-xs font-semibold text-slate-400">Last 6 Months</span>
          </div>
          <div className="h-64 flex items-center">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Sell & Buy / P2P Grid Card */}
        {/* Buy Grid Energy Card */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <span>⚡</span> Buy Grid Energy
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Buy clean energy directly from regional utility plants or neighbor-scale solar nodes.
            </p>

            <form onSubmit={handleInitiateBuy} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">UNITS TO BUY (kWh)</label>
                <input
                  type="number"
                  required
                  value={buyUnits}
                  onChange={(e) => setBuyUnits(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">ENERGY SOURCE</label>
                <select
                  value={buySource}
                  onChange={(e) => setBuySource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                >
                  <option value="utility">Utility Grid Plant (₹6.50/kWh)</option>
                  <option value="p2p">Neighborhood Grid Node (₹7.00/kWh)</option>
                </select>
              </div>

              <div className="pt-2 text-center bg-brand/5 border border-brand/10 p-2.5 rounded-2xl text-[10px] text-slate-400">
                Total Cost: <span className="font-bold text-brand text-xs">₹{(parseFloat(buyUnits || '0') * (buySource === 'utility' ? 6.5 : 7.0)).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-brand py-3 text-xs font-semibold text-white hover:bg-brand-dark transition-all mt-2 shadow-sm"
              >
                Buy Clean Units
              </button>
            </form>
          </div>

          <Link to="/marketplace" className="text-xs font-bold text-brand hover:underline flex items-center gap-1 mt-4">
            View Marketplace <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Solar Installation Progress Card */}
      {latestInstall && (
        <div className="glass-panel p-6 rounded-3xl shadow-glass space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Solar Panel Installation Tracker</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(latestInstall.status)}`}>
              {latestInstall.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium">Panel Capacity</p>
              <p className="font-bold">{latestInstall.panelCapacityKw} kW</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Quoted Cost</p>
              <p className="font-bold">₹{latestInstall.quoteAmount || 'Pending Quote'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Site Inspector</p>
              <p className="font-bold">{latestInstall.engineer?.name || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Installation Date</p>
              <p className="font-bold">
                {latestInstall.installationDate
                  ? new Date(latestInstall.installationDate).toLocaleDateString()
                  : 'Pending site inspection'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* P2P Energy Purchase History Ledger */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden mt-6 relative z-10">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <span className="text-brand">🛒</span>
          <h3 className="font-bold text-slate-800 dark:text-white">My Grid & P2P Energy Purchases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Purchase Date</th>
                <th className="px-6 py-4">Seller / Plant</th>
                <th className="px-6 py-4">Energy Volume</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Total Amount Paid</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No energy purchases recorded yet. Browse the Marketplace to buy clean units.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold">{p.seller?.name || 'Utility Solar Plant'}</td>
                    <td className="px-6 py-4">{p.unitsKwh} kWh</td>
                    <td className="px-6 py-4">₹{p.pricePerUnit}/kWh</td>
                    <td className="px-6 py-4 font-bold text-brand">₹{p.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-bold">
                        {p.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SolarPay Cryptographic Checkout Modal */}
      <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="SolarPay Secure P2P Gateway">
        {profile && (
          <form onSubmit={handleDashboardPurchase} className="space-y-4">
            <div className="rounded-2xl bg-brand/5 border border-brand/20 p-4 mb-4 text-center">
              <p className="text-xs text-slate-400 font-medium font-bold uppercase">SECURE CHECKOUT AMOUNT</p>
              <p className="text-3xl font-black text-brand">₹{(parseFloat(buyUnits || '0') * (buySource === 'utility' ? 6.5 : 7.0)).toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Buying: {buyUnits} kWh from {buySource === 'utility' ? 'Utility Solar Plant' : 'Local Neighbors'}</p>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="flex rounded-full bg-slate-100 dark:bg-slate-900 p-1 mb-4">
              <button
                type="button"
                onClick={() => setSelectedPayMethod('Card')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all ${
                  selectedPayMethod === 'Card'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayMethod('UPI')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all ${
                  selectedPayMethod === 'UPI'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                UPI Transfer
              </button>
            </div>

            {selectedPayMethod === 'Card' ? (
              <>
                {/* Animated Credit Card Mockup */}
                <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-brand-emerald to-brand text-white p-5 shadow-premium overflow-hidden mb-6 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-slate-200 tracking-widest font-semibold uppercase">SolarPay Gateway</p>
                      <div className="h-6 w-9 bg-yellow-400/90 rounded-md mt-2 flex items-center justify-center text-[8px] font-bold border border-yellow-350 shadow-sm pointer-events-none text-slate-800">CHIP</div>
                    </div>
                    <p className="text-sm font-black italic tracking-wider">SOLAR TRADE</p>
                  </div>
                  <div>
                    <p className="text-lg font-mono tracking-widest text-center my-1 select-all">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-slate-200 mt-1 font-mono">
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-slate-350">Cardholder</p>
                        <p className="font-bold text-xs uppercase truncate max-w-[150px]">{cardName || 'YOUR FULL NAME'}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-slate-350">Expires</p>
                          <p className="font-bold text-xs">{cardExpiry || 'MM/YY'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-slate-350">CVV</p>
                          <p className="font-bold text-xs">{cardCvv || '•••'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required={selectedPayMethod === 'Card'}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Card Number</label>
                    <input
                      type="text"
                      required={selectedPayMethod === 'Card'}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 2222 3333 4444"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Expiration</label>
                      <input
                        type="text"
                        required={selectedPayMethod === 'Card'}
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        required={selectedPayMethod === 'Card'}
                        value={cardCvv}
                        onChange={handleCvvChange}
                        maxLength="3"
                        placeholder="•••"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/20 text-center space-y-2">
                  <span className="text-4xl block">📱</span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Pay Instantly via UPI App</h4>
                  <p className="text-[11px] text-slate-500">Enter your UPI VPA address to trigger a collection request in your BHIM, Google Pay, PhonePe, or Paytm app.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    required={selectedPayMethod === 'UPI'}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. aditya@upi"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={paying}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
            >
              {paying ? 'Authorizing secure transaction...' : `Pay ₹${(parseFloat(buyUnits || '0') * (buySource === 'utility' ? 6.5 : 7.0)).toFixed(2)}`}
            </button>
          </form>
        )}
      </Modal>

      {/* Onboarding Preference Selector Overlay */}
      {profile && (!profile.customerType || profile.customerType === 'None') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel max-w-xl w-full p-8 rounded-3xl shadow-premium border border-white/20 dark:border-slate-800 text-center"
          >
            <span className="text-5xl mb-4 block">☀️</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-brand to-brand-emerald bg-clip-text text-transparent mb-2">
              Configure Your Clean Energy Account
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Welcome to Solar Trade! Please select your category to customize your energy recommendations and marketplace listings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectCustomerType('Household')}
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-brand/40 dark:hover:border-brand/40 text-left transition-all hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl mb-2 block">🏠</span>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Household Buy</h3>
                  <p className="text-xs text-slate-500">
                    Buy grid power or neighbor P2P energy for your home or household smart meter connections.
                  </p>
                </div>
                <div className="mt-4 text-xs font-bold text-brand">Configure Household &rarr;</div>
              </button>

              <button
                onClick={() => handleSelectCustomerType('Commercial')}
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-brand/40 dark:hover:border-brand/40 text-left transition-all hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl mb-2 block">🏢</span>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Commercial Buy</h3>
                  <p className="text-xs text-slate-500">
                    Buy clean energy for businesses, corporate offices, warehouses, or high-capacity power operations.
                  </p>
                </div>
                <div className="mt-4 text-xs font-bold text-brand">Configure Commercial &rarr;</div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Wallet Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit Funds to Wallet">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl text-[11px] text-slate-500">
            Top up your wallet balance instantly using card checkout simulations. Added balance can be used for purchasing P2P neighbor listings or utility power plans.
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

      {/* KYC Form Modal */}
      <Modal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} title="Verify My Identity (Customer KYC)">
        <form onSubmit={handleKycSubmit} className="space-y-4">
          <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl text-[11px] text-slate-500">
            Submit your details for simulated verification. Verification is mandatory to purchase green energy listings on our P2P marketplace.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">FULL NAME (AS ON ID)</label>
              <input
                type="text"
                required
                value={kycFullName}
                onChange={(e) => setKycFullName(e.target.value)}
                placeholder="Full Name"
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
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">PAN NUMBER</label>
              <input
                type="text"
                required
                value={kycPanNumber}
                onChange={(e) => setKycPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">AADHAAR / NATIONAL ID</label>
              <input
                type="text"
                required
                value={kycAadhaarNumber}
                onChange={(e) => setKycAadhaarNumber(e.target.value.replace(/\D/g, '').substring(0, 12))}
                placeholder="12-digit number"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Bank Settlement Details</h4>
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
                  placeholder="Holder Name"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ACCOUNT NUMBER</label>
                <input
                  type="text"
                  required
                  value={kycAccNumber}
                  onChange={(e) => setKycAccNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Account Number"
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
            {submittingKyc ? 'Submitting KYC details...' : 'Submit Verification'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDashboard;
