import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiPocket } from 'react-icons/fi';
import { Spinner } from '../components/Loader';

const EnergyPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    setSubscribingId(planId);
    try {
      const res = await api.post('/plans/subscribe', { planId }); // calls '/plans/subscribe' which is routed to subscriber controller
      // wait, check routing maps. In planRoutes: router.post('/subscribe', protect, subscribeToPlan); 
      // mounted under app.js as: app.use('/api/plans', planRoutes);
      // Wait, so the full endpoint is: POST /api/plans/subscribe. YES! That matches perfectly!
      if (res.data.success) {
        toast.success('Successfully subscribed to energy plan!');
      }
    } catch (err) {
      toast.error(err.message || 'Subscription failed');
    } finally {
      setSubscribingId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Grid Energy Subscription Plans</h2>
        <p className="text-sm text-slate-400 mt-1">Select from our environment friendly, 100% solar backed pricing packages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p._id} className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between hover:shadow-premium transition-all duration-300">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">{p.pricingType} Package</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{p.name}</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-white my-4">
                ₹{p.ratePerUnit.toFixed(2)} <span className="text-xs font-semibold text-slate-400">/ kWh</span>
              </p>
              <p className="text-xs text-slate-400 mb-6">{p.description}</p>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6 text-xs text-slate-500">
                {p.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <FiCheck className="text-brand" /> <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(p._id)}
              disabled={subscribingId === p._id}
              className="w-full text-center rounded-2xl bg-brand text-white py-3 text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
            >
              {subscribingId === p._id ? 'Activating Plan...' : 'Subscribe to Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnergyPlans;
