import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiDownload, FiCreditCard, FiCheckCircle, FiClock, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Auto-Pay States
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [autoPayMethod, setAutoPayMethod] = useState('UPI');
  const [autoPayLimit, setAutoPayLimit] = useState(5000);
  const [autoPayReminder, setAutoPayReminder] = useState(true);

  // SolarPay Modal States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedPayMethod, setSelectedPayMethod] = useState('Card'); // 'Card', 'Wallet', or 'UPI'
  const [upiId, setUpiId] = useState('');

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

  const fetchBillsAndSettings = async () => {
    try {
      const res = await api.get('/billing/my-bills');
      if (res.data.success) {
        setBills(res.data.data);
      }
      
      const settingsRes = await api.get('/billing/autopay/settings');
      if (settingsRes.data.success) {
        setAutoPayEnabled(settingsRes.data.data.enabled);
        setAutoPayMethod(settingsRes.data.data.paymentMethod);
        setAutoPayLimit(settingsRes.data.data.maxBillLimit);
        setAutoPayReminder(settingsRes.data.data.paymentReminder);
      }

      const walletRes = await api.get('/users/wallet/history');
      if (walletRes.data.success) {
        setWalletBalance(walletRes.data.data.balance);
      }
    } catch (err) {
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndSettings();
  }, []);

  const handleUpdateAutoPay = async (updates) => {
    try {
      const res = await api.put('/billing/autopay/settings', updates);
      if (res.data.success) {
        setAutoPayEnabled(res.data.data.enabled);
        setAutoPayMethod(res.data.data.paymentMethod);
        setAutoPayLimit(res.data.data.maxBillLimit);
        setAutoPayReminder(res.data.data.paymentReminder);
        toast.success('Auto-Pay configuration updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to save auto-pay settings');
    }
  };

  const handleGenerateMockInvoice = async () => {
    setGenerating(true);
    const toastLoader = toast.loading('Simulating smart meter reading...');
    try {
      const res = await api.post('/billing/mock-invoice');
      if (res.data.success) {
        toast.success('Mock meter invoice generated successfully!', { id: toastLoader });
        fetchBillsAndSettings();
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
    setSelectedPayMethod('Card');
    setUpiId('');
    setCheckoutModalOpen(true);
  };

  const handlePayBillSubmit = async (e) => {
    e.preventDefault();
    if (!activeBill) return;

    if (selectedPayMethod === 'Wallet' && walletBalance < activeBill.totalAmount) {
      return toast.error(`Insufficient wallet balance. Available: ₹${walletBalance.toLocaleString('en-IN')}, Required: ₹${activeBill.totalAmount.toLocaleString('en-IN')}`);
    }

    if (selectedPayMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      return toast.error('Please enter a valid UPI ID (e.g. username@bank)');
    }

    setPaying(true);
    const toastLoader = toast.loading('Initiating SolarPay secure checkout...');
    try {
      // 1. Create Checkout Intent
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: activeBill.totalAmount,
        type: 'Bill',
        referenceId: activeBill._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway rejected payment session');

      const { checkoutId, signature } = intentRes.data.data;

      // 2. Cryptographically Verify Signature and Complete Payment
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: selectedPayMethod,
        cardDetails: selectedPayMethod === 'Card' ? {
          name: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
        } : undefined,
        upiId: selectedPayMethod === 'UPI' ? upiId : undefined
      });

      if (verifyRes.data.success) {
        toast.success(`Successfully paid ₹${activeBill.totalAmount.toFixed(2)} bill!`, { id: toastLoader });
        setCheckoutModalOpen(false);
        fetchBillsAndSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Payment processing failed', { id: toastLoader });
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

  const handlePrintInvoicePDF = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      return toast.error('Popup blocked! Please allow popups to download invoice PDF.');
    }

    const itemsRows = invoice.items.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; text-align: left;">${item.description}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">₹${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; margin: 0; padding: 40px; background: #fff; }
            .invoice-box { max-w: 700px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 850; color: #0f172a; margin: 0; }
            .sub-title { font-size: 10px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }
            .inv-ref { font-size: 14px; font-weight: 700; color: #22c55e; margin: 0; }
            .inv-date { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }
            .details { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 12px; }
            .detail-title { font-size: 9px; color: #94a3b8; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
            .detail-val { font-weight: bold; color: #1e293b; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { text-transform: uppercase; color: #94a3b8; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-align: left; }
            th.right { text-align: right; }
            .total { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #e2e8f0; padding-top: 15px; font-size: 14px; font-weight: bold; }
            .total-amt { font-size: 20px; color: #22c55e; font-weight: 900; }
            .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <p class="title">SOLAR TRADE UTILITY</p>
                <p class="sub-title">Green Power Distribution Grid Node</p>
              </div>
              <div style="text-align: right;">
                <p class="inv-ref">${invoice.invoiceNumber}</p>
                <p class="inv-date">Date: ${new Date(invoice.billDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="details">
              <div>
                <div class="detail-title">BILL TO CUSTOMER</div>
                <p class="detail-val">${invoice.customer.name}</p>
                <p style="margin: 2px 0 0 0; color: #64748b;">${invoice.customer.email}</p>
              </div>
              <div style="text-align: right;">
                <div class="detail-title">INVOICE STATUS</div>
                <p class="detail-val" style="color: ${invoice.status === 'Paid' ? '#22c55e' : '#d97706'}; font-size: 13px;">${invoice.status.toUpperCase()}</p>
                <p style="margin: 2px 0 0 0; color: #64748b;">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="total">
              <span>TOTAL DUE AMOUNT:</span>
              <span class="total-amt">₹${invoice.totalAmount.toFixed(2)}</span>
            </div>

            <div class="footer">
              <p>Thank you for choosing renewable green energy. Solar Trade Node Punjab.</p>
              <p style="margin-top: 5px; font-size: 8px;">Generated securely via SolarPay gateway. Signature verified.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

      {/* macOS window control dots */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-3 h-3 rounded-full bg-red-400 block hover:opacity-80 transition-opacity cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 block hover:opacity-80 transition-opacity cursor-pointer" />
        <span className="w-3 h-3 rounded-full bg-green-400 block hover:opacity-80 transition-opacity cursor-pointer" />
      </div>

      <div className="flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-sm text-slate-400 mt-1">Manage energy bills, configure auto-pay, and process secure payments.</p>
        </div>
        <button
          onClick={handleGenerateMockInvoice}
          disabled={generating}
          className="rounded-full bg-brand/10 border border-brand/20 hover:bg-brand hover:text-white text-brand px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
        >
          {generating ? 'Reading Meter...' : 'Simulate Meter Reading'}
        </button>
      </div>

      {/* Auto-Pay Configuration Card */}
      <div className="glass-panel p-6 rounded-3xl shadow-glass relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 border border-white/20 dark:border-slate-800/40">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Auto-Pay Billing Configuration</h3>
              <p className="text-xs text-slate-400">Automatically settle statements below your custom limit on billing dates.</p>
            </div>
            <button
              onClick={() => handleUpdateAutoPay({ enabled: !autoPayEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                autoPayEnabled ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoPayEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">AUTO-PAYMENT METHOD</label>
              <select
                disabled={!autoPayEnabled}
                value={autoPayMethod}
                onChange={(e) => handleUpdateAutoPay({ paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-500"
              >
                <option value="UPI">UPI Simulation</option>
                <option value="Debit Card">Saved Debit Card</option>
                <option value="Net Banking">Net Banking Sandbox</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MAX BILL LIMIT (₹)</label>
              <input
                type="number"
                disabled={!autoPayEnabled}
                value={autoPayLimit}
                onChange={(e) => handleUpdateAutoPay({ maxBillLimit: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-850 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${autoPayEnabled ? 'bg-brand' : 'bg-slate-400'} block`} />
            <span className="font-semibold text-slate-700 dark:text-slate-350">
              Auto-Pay is currently {autoPayEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="leading-relaxed text-slate-400">
            When active, whenever a smart meter simulation bill is created, if the total invoice cost is less than your maximum limit (₹{autoPayLimit.toLocaleString()}), the gateway automatically verifies and records the payment.
          </p>
          <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              disabled={!autoPayEnabled}
              checked={autoPayReminder}
              onChange={(e) => handleUpdateAutoPay({ paymentReminder: e.target.checked })}
              className="rounded border-slate-200 text-brand focus:ring-brand text-xs"
            />
            <span className="text-slate-400">Enable WhatsApp/Email Auto-Pay reminder warnings</span>
          </label>
        </div>
      </div>

      {/* Bill List Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
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
                    No billing history found. Click "Simulate Meter Reading" to generate one.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                    <td className="px-6 py-4 font-medium">{new Date(bill.billDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(bill.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{bill.unitsConsumed} kWh</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">₹{bill.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1.5 w-fit ${
                          bill.status === 'Paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                            : bill.status === 'Unpaid'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                        }`}
                      >
                        {getStatusIcon(bill.status)}
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(bill._id)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 p-2 text-xs font-bold transition-all"
                        title="Download Invoice PDF"
                      >
                        <FiDownload />
                      </button>
                      {bill.status !== 'Paid' && (
                        <button
                          onClick={() => openCheckout(bill)}
                          className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-dark transition-all"
                        >
                          Pay Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Card Payment Modal */}
      <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="SolarPay Payment Portal">
        {activeBill && (
          <div className="space-y-6">
            {/* Payment Method Selector Tabs */}
            <div className="flex rounded-full bg-slate-100 dark:bg-slate-900 p-1">
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
                onClick={() => setSelectedPayMethod('Wallet')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all ${
                  selectedPayMethod === 'Wallet'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                SolarPay Wallet
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
                {/* Real-time Animated Credit Card mockup */}
                <div className="w-full max-w-sm mx-auto h-48 rounded-2xl bg-gradient-to-br from-brand-emerald via-brand to-brand-dark p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between transform transition-transform hover:scale-105">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest opacity-80">SolarPay Secure Token</p>
                      <p className="text-lg font-bold tracking-tight mt-1">Solar Trade Node</p>
                    </div>
                    <span className="text-xl">☀️</span>
                  </div>
                  <div>
                    <p className="text-lg font-mono tracking-widest text-center my-3">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                  </div>
                  <div className="flex justify-between items-end text-xs font-mono">
                    <div>
                      <p className="text-[8px] opacity-70">CARD HOLDER</p>
                      <p className="font-bold uppercase tracking-wider truncate max-w-[150px]">
                        {cardName || 'YOUR FULL NAME'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] opacity-70">EXPIRES</p>
                      <p className="font-bold">{cardExpiry || 'MM/YY'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] opacity-70">CVV</p>
                      <p className="font-bold">{cardCvv ? '•••' : '000'}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePayBillSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">CARDHOLDER NAME</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. Aditya Sharma"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">CARD NUMBER</label>
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
                    className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
                  >
                    {paying ? 'Authorizing secure transaction...' : `Pay ₹${activeBill.totalAmount.toFixed(2)}`}
                  </button>
                </form>
              </>
            ) : selectedPayMethod === 'Wallet' ? (
              <form onSubmit={handlePayBillSubmit} className="space-y-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">AVAILABLE WALLET BALANCE</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">₹{walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">INVOICE AMOUNT</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">₹{activeBill.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex justify-between items-center text-xs">
                    <span className="text-slate-450 font-bold">BALANCE AFTER PAYMENT</span>
                    <span className={`font-black ${walletBalance >= activeBill.totalAmount ? 'text-brand-emerald' : 'text-red-500'}`}>
                      ₹{(walletBalance - activeBill.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {walletBalance < activeBill.totalAmount && (
                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl text-[11px] text-red-500 text-center">
                    Warning: Insufficient wallet balance. Please go to "My Wallet" to top up.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paying || walletBalance < activeBill.totalAmount}
                  className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg disabled:opacity-50"
                >
                  {paying ? 'Deducting from wallet...' : `Confirm Wallet Payment (₹${activeBill.totalAmount.toFixed(2)})`}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePayBillSubmit} className="space-y-4">
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
                    placeholder="e.g. username@bank"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
                >
                  {paying ? 'Authorizing UPI payment...' : `Pay ₹${activeBill.totalAmount.toFixed(2)}`}
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Invoice Download Modal (simulated print preview) */}
      <Modal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="Invoice Details">
        {fetchingInvoice ? (
          <div className="py-10 text-center"><Spinner /></div>
        ) : (
          invoiceData && (
            <div className="space-y-6 text-sm text-slate-600 dark:text-slate-350 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Solar Trade Utility</h3>
                  <p className="text-[10px] text-slate-400">Green Power Distribution Grid, Amritsar, Punjab</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand">{invoiceData.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400">Date: {new Date(invoiceData.billDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">CUSTOMER DETAILS</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{invoiceData.customer.name}</p>
                  <p className="text-slate-400 truncate max-w-[150px]">{invoiceData.customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">PAYMENT STATUS</p>
                  <span className={`inline-block mt-1 font-bold ${invoiceData.status === 'Paid' ? 'text-brand' : 'text-yellow-600'}`}>
                    {invoiceData.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs mt-4">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoiceData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">TOTAL DUE AMOUNT:</span>
                <span className="font-black text-lg text-brand">₹{invoiceData.totalAmount.toFixed(2)}</span>
              </div>

              <div className="text-center pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePrintInvoicePDF(invoiceData)}
                  className="rounded-full bg-brand text-white hover:bg-brand-dark px-5 py-2 text-xs font-bold transition-all shadow-md"
                >
                  Download Invoice (PDF)
                </button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default Billing;
