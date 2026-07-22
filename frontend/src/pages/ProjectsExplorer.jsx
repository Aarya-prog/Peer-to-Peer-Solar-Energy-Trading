import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiMapPin, FiAward, FiDollarSign, FiInfo, FiLock, FiCheck } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const ProjectsExplorer = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycRecord, setKycRecord] = useState(null);

  // Investment Modal States
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [amount, setAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  
  // Duration & Agreement States
  const [durationMonths, setDurationMonths] = useState('12');
  const [legalNameSignature, setLegalNameSignature] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [pdfViewOpen, setPdfViewOpen] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('Card'); // 'Card', 'Wallet', or 'UPI'
  const [upiId, setUpiId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const fetchProjectsAndKyc = async () => {
    try {
      const res = await api.get('/investments/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
      const kycRes = await api.get('/kyc/status');
      if (kycRes.data.success) {
        setKycRecord(kycRes.data.data);
      }
      const profileRes = await api.get('/users/profile');
      if (profileRes.data.success) {
        setUserProfile(profileRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndKyc();
  }, []);

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

  const openInvestModal = (proj) => {
    if (!kycRecord || kycRecord.status !== 'Verified') {
      return toast.error('You must complete your KYC verification before investing.');
    }
    setActiveProject(proj);
    setAmount('');
    setLegalNameSignature('');
    setAgreementAccepted(false);
    setDurationMonths('12');
    setPaymentMethod('Card');
    setUpiId('');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setInvestModalOpen(true);
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!activeProject) return;

    const investAmt = parseFloat(amount);
    if (isNaN(investAmt) || investAmt <= 0) {
      return toast.error('Please enter a valid investment amount');
    }

    if (investAmt < (activeProject.minimumInvestment || 10000)) {
      return toast.error(`Minimum investment allowed is ₹${(activeProject.minimumInvestment || 10000).toLocaleString()}`);
    }

    if (investAmt > (activeProject.maximumInvestment || 500000)) {
      return toast.error(`Maximum investment limit is ₹${(activeProject.maximumInvestment || 500000).toLocaleString()} per transaction.`);
    }

    const remainingCap = (activeProject.maximumCapacity || activeProject.targetFunding) - activeProject.fundedAmount;
    if (investAmt > remainingCap) {
      return toast.error(`Investment exceeds remaining capacity of ₹${remainingCap.toLocaleString()}`);
    }

    if (!agreementAccepted || !legalNameSignature.trim()) {
      return toast.error('Please accept the agreement and sign with your legal name.');
    }

    if (paymentMethod === 'Wallet' && userProfile && userProfile.balance < investAmt) {
      return toast.error(`Insufficient wallet balance. Available: ₹${userProfile.balance.toLocaleString('en-IN')}`);
    }

    if (paymentMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      return toast.error('Please enter a valid UPI ID (e.g. username@bank)');
    }

    setInvesting(true);
    const toastLoader = toast.loading('Processing secure investment checkout...');
    try {
      // 1. Create Checkout Intent
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: investAmt,
        type: 'Investment',
        referenceId: activeProject._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway initiation failed');

      const { checkoutId, signature } = intentRes.data.data;

      // 2. Cryptographically verify signature and commit investment logic
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: paymentMethod,
        cardDetails: paymentMethod === 'Card' ? {
          name: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
        } : null,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
        legalNameSignature,
        agreementAccepted,
        durationMonths: parseInt(durationMonths),
      });

      if (verifyRes.data.success) {
        toast.success(`Successfully invested ₹${investAmt.toLocaleString()} in ${activeProject.name}!`, { id: toastLoader });
        setInvestModalOpen(false);
        setAmount('');
        fetchProjectsAndKyc();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Investment execution failed', { id: toastLoader });
    } finally {
      setInvesting(false);
    }
  };

  if (loading) return <Spinner />;

  // Calculate dynamic yield predictions inside modal
  const inputAmt = parseFloat(amount) || 0;
  const lockMonths = parseInt(durationMonths) || 12;
  const roiMap = { 1: 6, 6: 8, 12: 10, 36: 12, 60: 15 };
  const selectedROI = roiMap[lockMonths] || 10;
  const expectedReturn = inputAmt + (inputAmt * (selectedROI / 100) * (lockMonths / 12));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solar Crowdfund Projects</h2>
          <p className="text-sm text-slate-400 mt-1">Invest in regional solar microgrid structures and receive lock-in return yields.</p>
        </div>
      </div>

      {/* KYC Block Banner */}
      {(!kycRecord || kycRecord.status !== 'Verified') && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-3xl flex items-center gap-3">
          <FiInfo className="text-amber-600 text-xl flex-shrink-0" />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-amber-700 dark:text-amber-400">KYC Verification Pending:</span> You cannot purchase green energy crowdfund plans until your KYC identity is approved. Please navigate to your dashboard and complete documentation.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const progressPercent = Math.min(100, Math.floor((proj.fundedAmount / proj.targetFunding) * 100));
          const remainingCapacity = (proj.maximumCapacity || proj.targetFunding) - proj.fundedAmount;
          const kycVerified = kycRecord?.status === 'Verified';

          return (
            <div key={proj._id} className="glass-panel rounded-3xl overflow-hidden shadow-glass flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[180px]">{proj.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      proj.status === 'Operational'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                        : proj.status === 'Construction'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3">{proj.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <FiMapPin /> <span>{proj.location}</span>
                </div>

                {/* Investment Limits Display */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Min Investment:</span>
                    <span className="font-bold text-slate-800 dark:text-white">₹{(proj.minimumInvestment || 10000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Investment:</span>
                    <span className="font-bold text-slate-800 dark:text-white">₹{(proj.maximumInvestment || 500000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5">
                    <span>Remaining Capacity:</span>
                    <span className="font-bold text-brand">₹{remainingCapacity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-slate-400 font-medium">Expected ROI</p>
                    <p className="font-bold text-brand flex items-center gap-0.5"><FiTrendingUp /> {proj.expectedROI}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Energy Capacity</p>
                    <p className="font-bold">{proj.energyGeneratedMwh ? `${proj.energyGeneratedMwh} MWh` : 'Under construction'}</p>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Funding Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Raised: ₹{proj.fundedAmount.toLocaleString()}</span>
                    <span>Goal: ₹{proj.targetFunding.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                {proj.status === 'Funding' ? (
                  <button
                    onClick={() => openInvestModal(proj)}
                    disabled={!kycVerified}
                    className={`w-full text-center rounded-2xl py-2.5 text-xs font-bold transition-all shadow-md ${
                      kycVerified 
                        ? 'bg-brand text-white hover:bg-brand-dark shadow-green-500/20' 
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Invest Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full text-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 py-2.5 text-xs font-bold cursor-not-allowed"
                  >
                    Funding Closed ({proj.status})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Crowdfund Invest Modal */}
      <Modal isOpen={investModalOpen} onClose={() => setInvestModalOpen(false)} title={`Invest in ${activeProject?.name}`}>
        {activeProject && (
          <form onSubmit={handleInvest} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">PROJECT BASE ROI</p>
                  <p className="text-xl font-bold text-brand">{activeProject.expectedROI}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">REMAINING CAPACITY</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    ₹{((activeProject.maximumCapacity || activeProject.targetFunding) - activeProject.fundedAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">INVESTMENT AMOUNT (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">INVESTMENT PLAN / LOCK-IN</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
                >
                  <option value="1">1 Month Plan (6% ROI)</option>
                  <option value="6">6 Months Plan (8% ROI)</option>
                  <option value="12">1 Year Lock (10% ROI)</option>
                  <option value="36">3 Years Lock (12% ROI)</option>
                  <option value="60">5 Years Lock (15% ROI)</option>
                </select>
              </div>
            </div>

            {inputAmt > 0 && (
              <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl space-y-1 text-center">
                <p className="text-[10px] text-slate-400 font-medium">ESTIMATED YIELD PROJECTION</p>
                <div className="flex justify-center items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-400">₹{inputAmt.toLocaleString()} principal</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-lg font-bold text-brand">₹{expectedReturn.toFixed(2)} maturity value</span>
                </div>
                <p className="text-[9px] text-slate-400">Lock-in ROI of {selectedROI}% applied for {lockMonths} months.</p>
              </div>
            )}

            {/* Read & Sign Contract Button */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block mb-1">INVESTMENT LEGAL AGREEMENT</label>
              <button
                type="button"
                onClick={() => setPdfViewOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white py-3 text-xs font-bold transition-all"
              >
                📄 Read &amp; Sign Legal Contract (Full Page PDF Mode)
              </button>
              {agreementAccepted && legalNameSignature.trim() && (
                <p className="text-[10px] text-emerald-600 font-bold text-center mt-1 flex items-center justify-center gap-1">
                  ✓ Signed digitally by {legalNameSignature}
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <label className="text-[10px] font-bold text-slate-400 block">SELECT PAYMENT WAY</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border text-center ${
                    paymentMethod === 'Card'
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50/50'
                  }`}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Wallet')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border text-center ${
                    paymentMethod === 'Wallet'
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50/50'
                  }`}
                >
                  👛 Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border text-center ${
                    paymentMethod === 'UPI'
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50/50'
                  }`}
                >
                  📱 UPI
                </button>
              </div>
            </div>

            {/* Conditionally Render Payment Details */}
            {paymentMethod === 'Card' ? (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Secure Card Authorization</h4>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">CARDHOLDER NAME</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">CARD NUMBER</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">EXPIRY DATE</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={handleCvvChange}
                      placeholder="•••"
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'Wallet' ? (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available Wallet Balance:</span>
                  <span className="font-bold text-slate-800 dark:text-white">₹{userProfile?.balance?.toLocaleString('en-IN') || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Investment Cost:</span>
                  <span className="font-bold text-slate-800 dark:text-white">₹{(parseFloat(amount) || 0).toLocaleString('en-IN')}</span>
                </div>
                {userProfile && userProfile.balance >= (parseFloat(amount) || 0) ? (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
                    <span className="text-slate-550 font-semibold">Balance After Investment:</span>
                    <span className="font-extrabold text-brand-emerald">₹{(userProfile.balance - (parseFloat(amount) || 0)).toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl text-[10px] text-red-500 text-center">
                    ⚠️ Insufficient wallet balance. Please add funds before checking out.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 text-center space-y-1.5">
                  <span className="text-3xl block">📱</span>
                  <h4 className="font-bold text-xs text-slate-850 dark:text-white">Pay via UPI App</h4>
                  <p className="text-[10px] text-slate-450">Enter your UPI VPA address to request simulated collection request.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    required={paymentMethod === 'UPI'}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. username@bank"
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={investing || !agreementAccepted || !legalNameSignature.trim() || (paymentMethod === 'Wallet' && (!userProfile || userProfile.balance < (parseFloat(amount) || 0)))}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-dark py-3 text-xs font-semibold text-white transition-all shadow-md shadow-green-500/20 disabled:opacity-50 mt-2"
            >
              {investing ? 'Authorizing secure investment checkout...' : 'Confirm Agreement & Invest'}
            </button>
          </form>
        )}
      </Modal>

      {/* Full-Page PDF Overlay Contract Simulator */}
      {pdfViewOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] overflow-y-auto flex flex-col justify-between select-none">
          {/* Header Bar resembling PDF viewer */}
          <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div>
                <h3 className="text-xs font-extrabold tracking-wide uppercase">solar_crowdfund_partnership_agreement.pdf</h3>
                <p className="text-[10px] text-slate-400">PDF Reader v1.2 • Digital Signature Protected</p>
              </div>
            </div>
            <button
              onClick={() => setPdfViewOpen(false)}
              className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-red-500/30"
            >
              Close PDF Reader
            </button>
          </div>

          {/* Document Content representing A4 Paper Sheet */}
          <div className="flex-1 bg-slate-900/40 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto bg-white text-slate-850 p-8 sm:p-14 shadow-2xl rounded-sm border border-slate-200 min-h-[1000px] flex flex-col justify-between relative font-serif">
              {/* Paper Watermark background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none text-[8rem] font-bold uppercase rotate-45 select-none text-slate-800">
                SOLAR SECURE
              </div>

              {/* Letterhead */}
              <div className="border-b-2 border-slate-800 pb-4 mb-6 relative z-10 flex justify-between items-center text-xs">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900">SOLAR TRADE CROWDFUND</h1>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Decentralized Green Energy microgrids</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Contract Ref: ST-{activeProject._id?.substring(18).toUpperCase()}</p>
                  <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contract Clauses */}
              <div className="flex-1 space-y-4 text-xs leading-relaxed text-slate-700 relative z-10">
                <h2 className="text-sm font-bold text-center text-slate-900 uppercase underline tracking-wider mb-2">
                  SOLAR INVESTMENT &amp; RISK ACKNOWLEDGEMENT PARTNERSHIP AGREEMENT
                </h2>

                <p>
                  This agreement is entered into on this <strong className="text-slate-900">{new Date().toLocaleDateString()}</strong> between the logged-in verified platform Investor (hereinafter referred to as the "Participant") and Solar Trade Co. (hereinafter referred to as the "Platform").
                </p>

                <div>
                  <h3 className="font-bold text-slate-950 underline mb-1">CLAUSE 1: CROWDFUND CAPITAL CONTRIBUTIONS &amp; MATURITY</h3>
                  <p>
                    The Participant agrees to invest a principal sum of <strong className="text-slate-900 font-sans">₹{(parseFloat(amount) || 0).toLocaleString()}</strong> in the crowdfund microgrid project <strong className="text-slate-950">{activeProject.name}</strong>. This capital will be locked under secure smart contracts for a period of <strong className="text-slate-950 font-sans">{durationMonths} Month(s)</strong>. Payouts, interest accumulations, and principal redemption will mature automatically on the maturity timestamp based on the plan terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-950 underline mb-1">CLAUSE 2: PROJECT PERFORMANCE AND YIELD VOLATILITY</h3>
                  <p>
                    Clean energy infrastructure performance is subject to sun radiation patterns, power grid loads, local state electricity board regulations, and technical maintenance cycles. Returns projected under lock-in plans (accruing up to 15% ROI) are simulated based on historical outputs and do not represent bank guarantees.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-950 underline mb-1">CLAUSE 3: MATURITY REDEMPTION AND WITHDRAWAL</h3>
                  <p>
                    Once the maturity lock duration elapses, the locked principal is released back to the investor's balance. The Participant acknowledges that premature liquidations or withdrawal requests are strictly prohibited prior to the maturity date.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-950 underline mb-1">CLAUSE 4: DIGITAL SIGNATURE CONSENT</h3>
                  <p>
                    By checking the acceptance box and typing their legal name below, the Participant consents to digitally signing this partnership contract. This agreement holds legally binding power equivalent to physical signatures under state electronic transactions acts.
                  </p>
                </div>
              </div>

              {/* Digital Signing Section inside A4 paper footer */}
              <div className="border-t border-slate-200 pt-6 mt-8 space-y-4 relative z-10 font-sans">
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="pdf_accept"
                    checked={agreementAccepted}
                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                    className="mt-1 rounded border-slate-350 text-brand focus:ring-brand"
                  />
                  <label htmlFor="pdf_accept" className="text-[11px] text-slate-650 cursor-pointer select-none leading-normal">
                    <strong>Contract Acceptance Checkbox:</strong> I have read and agree to all clauses, lock-in terms, and risk disclosures listed in the investment agreement above.
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">TYPE LEGAL NAME SIGNATURE</label>
                    <input
                      type="text"
                      required
                      value={legalNameSignature}
                      onChange={(e) => setLegalNameSignature(e.target.value)}
                      placeholder="e.g. Aditya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-350 bg-white text-slate-850 font-serif text-sm focus:outline-none focus:border-brand font-bold italic"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!agreementAccepted || !legalNameSignature.trim()) {
                        return toast.error('Please accept the agreement and type your signature first.');
                      }
                      setPdfViewOpen(false);
                      toast.success('Contract signature saved! Return to checkout to finalize.');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-950 text-white rounded-xl py-3 text-xs font-bold transition-all border border-slate-700 shadow-md"
                  >
                    Save Signature &amp; Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsExplorer;
