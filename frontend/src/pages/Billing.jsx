import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiDownload, FiCreditCard, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // SolarPay Modal States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);

  // Invoice Print Modal States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

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

  const fetchBills = async () => {
    try {
      const res = await api.get('/billing/my-bills');
      if (res.data.success) {
        setBills(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleGenerateMockInvoice = async () => {
    setGenerating(true);
    const toastLoader = toast.loading('Simulating smart meter reading...');
    try {
      const res = await api.post('/billing/mock-invoice');
      if (res.data.success) {
        toast.success('Mock meter invoice generated successfully!', { id: toastLoader });
        fetchBills();
      }
    } catch (err) {
      toast.error('Simulation failed', { id: toastLoader });
    } finally {
      setGenerating(false);
    }
  };

  const openCheckout = (bill) => {
    setActiveBill(bill);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCheckoutModalOpen(true);
  };

  const handleSolarPay = async (e) => {
    e.preventDefault();
    if (!activeBill) return;

    setPaying(true);
    try {
      // 1. Create secure checkout intent
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: activeBill.totalAmount,
        type: 'Bill',
        referenceId: activeBill._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway initiation failed');

      const { checkoutId, signature } = intentRes.data.data;

      // 2. Cryptographically verify signature and complete payout
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: 'Card',
      });

      if (verifyRes.data.success) {
        toast.success(`Bill Paid successfully! Transaction Ref: ${checkoutId}`);
        setCheckoutModalOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || 'Payment verification failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async (billId) => {
    setFetchingInvoice(true);
    setInvoiceModalOpen(true);
    try {
      const res = await api.get(`/billing/invoice/${billId}/download`);
      if (res.data.success) {
        setInvoiceData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load invoice information');
      setInvoiceModalOpen(false);
    } finally {
      setFetchingInvoice(false);
    }
  };

  const getStatusIcon = (status) => {
    return {
      Paid: <FiCheckCircle className="text-brand h-5 w-5" />,
      Unpaid: <FiClock className="text-yellow-500 h-5 w-5" />,
      Overdue: <FiAlertTriangle className="text-red-500 h-5 w-5" />,
    }[status] || <FiClock />;
  };

  if (loading) return <Spinner />;

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

      <div className="flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-sm text-slate-400 mt-1">Manage energy bills and process secure transactions.</p>
        </div>
        <button
          onClick={handleGenerateMockInvoice}
          disabled={generating}
          className="rounded-full bg-brand/10 border border-brand/20 hover:bg-brand hover:text-white text-brand px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
        >
          {generating ? 'Reading Meter...' : 'Simulate Meter Reading'}
        </button>
      </div>

      {/* Bill List Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Bill Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Consumption</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {bills.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                  No billing history found.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4">{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(bill.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{bill.unitsConsumed} kWh</td>
                  <td className="px-6 py-4 font-bold">₹{bill.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {getStatusIcon(bill.status)}
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadInvoice(bill._id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <FiDownload /> View Invoice
                    </button>
                    {bill.status !== 'Paid' && (
                      <button
                        onClick={() => openCheckout(bill)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition-all shadow-md shadow-green-500/10"
                      >
                        <FiCreditCard /> Pay Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SolarPay Cryptographic Checkout Modal */}
      <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="SolarPay Secure Gateway">
        {activeBill && (
          <form onSubmit={handleSolarPay} className="space-y-4">
            <div className="rounded-2xl bg-brand/5 border border-brand/20 p-4 mb-4 text-center">
              <p className="text-xs text-slate-400 font-medium">TOTAL PAYOUT DUE</p>
              <p className="text-3xl font-black text-brand">₹{activeBill.totalAmount.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Ref: {activeBill._id.toString().substring(18).toUpperCase()}</p>
            </div>

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
                  required
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
                  required
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
                    required
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
                    required
                    value={cardCvv}
                    onChange={handleCvvChange}
                    maxLength="3"
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {paying ? 'Authorizing Payout...' : `Secure Pay ₹${activeBill.totalAmount.toFixed(2)}`}
            </button>
          </form>
        )}
      </Modal>

      {/* Invoice Details Print View Modal */}
      <Modal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="Tax Invoice Details">
        {fetchingInvoice ? (
          <Spinner />
        ) : (
          invoiceData && (
            <div className="space-y-6 text-slate-800 dark:text-slate-200 p-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold bg-gradient-to-r from-brand to-brand-emerald bg-clip-text text-transparent">Solar Trade</h4>
                  <p className="text-xs text-slate-400">Green Power Grid Corp</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{invoiceData.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">Date: {new Date(invoiceData.billDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 dark:border-slate-800 py-3 text-xs space-y-1">
                <p className="font-bold">BILLED TO:</p>
                <p>{invoiceData.customer.name}</p>
                <p className="text-slate-400">{invoiceData.customer.email}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Items</p>
                {invoiceData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{item.description}</span>
                    <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center font-bold text-lg">
                <span>Total Due:</span>
                <span className="text-brand">₹{invoiceData.totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 text-xs font-bold transition-all text-center"
              >
                Print / Save as PDF
              </button>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default Billing;
