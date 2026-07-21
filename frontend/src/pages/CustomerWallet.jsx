import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiArrowRight, FiCheckCircle, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const CustomerWallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const fetchWalletDetails = async () => {
    try {
      const res = await api.get('/users/wallet/history');
      if (res.data.success) {
        setWalletData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load wallet ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

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
          name: cardName,
          number: cardNumber,
          expiry: cardExpiry,
          cvv: cardCvv,
        }
      });

      if (verifyRes.data.success) {
        toast.success(`Successfully deposited ₹${amt.toLocaleString('en-IN')} to your wallet balance!`, { id: toastLoader });
        setDepositModalOpen(false);
        setDepositAmount('');
        fetchWalletDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Deposit failed', { id: toastLoader });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10 p-4 sm:p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Wallet & Balance Ledger</h2>
          <p className="text-sm text-slate-400 mt-1">Simulate credits, top up your balance, and track transaction history.</p>
        </div>
        <button
          onClick={() => setDepositModalOpen(true)}
          className="rounded-full bg-brand text-white px-5 py-2.5 text-xs font-bold hover:bg-brand-dark transition-all shadow-md shadow-green-500/20"
        >
          + Deposit Funds
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Available Wallet Balance</p>
            <p className="text-3xl font-black text-brand-emerald">
              ₹{walletData?.balance?.toLocaleString('en-IN') || '0.00'}
            </p>
            <p className="text-[10px] text-slate-400">Instantly redeemable for energy utility plans.</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
            <FiDollarSign />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-glass flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Accrued Reward Points</p>
            <p className="text-3xl font-black text-brand">
              {walletData?.rewardPoints || 0} Points
            </p>
            <p className="text-[10px] text-slate-400">Earned via solar generation and green neighbor trades.</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl">
            <FiCheckCircle />
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FiActivity className="text-brand" />
          <h3 className="font-bold text-slate-800 dark:text-white">Transaction Logs Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {!walletData?.transactions || walletData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No transactions logs recorded. Click "Deposit Funds" to make your first wallet deposit.
                  </td>
                </tr>
              ) : (
                walletData.transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 font-mono text-xs text-slate-450">{tx._id}</td>
                    <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{tx.method}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        tx.type === 'Deposit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' :
                        tx.type === 'Investment' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400' :
                        'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        tx.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-extrabold ${
                      tx.type === 'Deposit' ? 'text-green-600 dark:text-green-400' : 'text-slate-650 dark:text-slate-350'
                    }`}>
                      {tx.type === 'Deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
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
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">CARD NUMBER</label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                const parts = [];
                for (let i = 0; i < val.length; i += 4) {
                  parts.push(val.substring(i, i + 4));
                }
                setCardNumber(parts.length > 0 ? parts.join(' ') : val);
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
                value={cardExpiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                  if (val.length >= 2) {
                    val = `${val.substring(0, 2)}/${val.substring(2)}`;
                  }
                  setCardExpiry(val);
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
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
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

export default CustomerWallet;
