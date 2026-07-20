import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/Loader';
import { FiPackage, FiCalendar, FiCheck, FiXCircle, FiArrowRight, FiInfo } from 'react-icons/fi';

const MySubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchActiveSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/active/current');
      if (res.data.success) {
        setSubscription(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load active subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSubscription();
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your current active energy subscription plan? Base connection charges may still apply.')) return;

    setCancelling(true);
    const toastLoader = toast.loading('Processing contract termination...');
    try {
      const res = await api.put('/subscriptions/cancel/current');
      if (res.data.success) {
        toast.success('Subscription cancelled successfully!', { id: toastLoader });
        fetchActiveSubscription();
      }
    } catch (err) {
      toast.error(err.message || 'Cancellation failed', { id: toastLoader });
    } finally {
      setCancelling(false);
    }
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

      <div className="flex justify-between items-center relative z-10 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Grid Subscription</h2>
          <p className="text-sm text-slate-400 mt-1">Review active energy plans, contract parameters, and utility parameters.</p>
        </div>
      </div>

      {!subscription ? (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-4 relative z-10">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-850 rounded-full mx-auto flex items-center justify-center text-3xl">
            📡
          </div>
          <h3 className="font-bold text-lg text-slate-700 dark:text-slate-250">No Active Grid Subscription</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You are currently connected on the standard default backup utility grid. Subscribe to a green tariff plan to optimize savings.
          </p>
          <Link
            to="/plans"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition-all shadow-md"
          >
            Browse Energy Plans <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Main Plan Card */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass md:col-span-2 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Active Subscription
                </span>
                <h3 className="text-2xl font-black mt-3 text-slate-850 dark:text-white">{subscription.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{subscription.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">TARIFF RATE</p>
                <p className="text-3xl font-black text-brand">₹{subscription.ratePerUnit}</p>
                <p className="text-[10px] text-slate-400 font-semibold">per kWh consumed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-xs">
              <div className="flex items-center gap-2.5">
                <FiCalendar className="text-slate-400 text-base" />
                <div>
                  <p className="text-slate-400 font-medium">Contract Terms</p>
                  <p className="font-bold">{subscription.minimumContractMonths || 12} Months Minimum</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <FiInfo className="text-slate-400 text-base" />
                <div>
                  <p className="text-slate-400 font-medium">Billing Cycle</p>
                  <p className="font-bold">Monthly Meter Reading</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <FiPackage className="text-slate-400 text-base" />
                <div>
                  <p className="text-slate-400 font-medium">Pricing Scheme</p>
                  <p className="font-bold">{subscription.pricingType || 'Fixed'} Rate</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Included Contract Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {subscription.features?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850/30 p-2.5 rounded-2xl">
                    <FiCheck className="text-brand-emerald text-base shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cancellation Actions */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between space-y-6">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Manage Contract</h4>
              <p className="text-xs text-slate-400 mb-4">
                You can terminate this energy contract at any time. Cancellation removes green tariff limits and reverts your account to standard backup rates.
              </p>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full text-center rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 text-xs font-bold transition-all"
              >
                {cancelling ? 'Terminating...' : 'Cancel Subscription'}
              </button>
            </div>

            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl text-xs text-slate-500 flex items-start gap-2">
              <span className="mt-0.5">ℹ️</span>
              <span>
                To modify or switch to a different green electricity plan, browse active rates and simply select "Subscribe" on your preferred plan to auto-update.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubscription;
