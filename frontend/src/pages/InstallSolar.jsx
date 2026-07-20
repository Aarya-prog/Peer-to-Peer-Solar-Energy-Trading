import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiTool, FiDollarSign } from 'react-icons/fi';

const InstallSolar = () => {
  const [capacity, setCapacity] = useState('5.0');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/installations/request', {
        panelCapacityKw: parseFloat(capacity),
        street,
        city,
        state,
        zip,
      });

      if (res.data.success) {
        toast.success('Solar panel installation request submitted!');
        // Clear
        setStreet('');
        setCity('');
        setState('');
        setZip('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Cost estimates: capacity * $1200
  const estimatedCost = (parseFloat(capacity || '0') * 50000).toLocaleString('en-IN');

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left side info */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <FiTool /> Installation Details
        </h3>
        <p className="text-xs text-slate-400">
          Our standard rooftop solar panel deployments are supported by clean grid-tie configurations. 
          Upon request:
        </p>
        <ol className="list-decimal pl-4 text-xs text-slate-500 space-y-2">
          <li>We will schedule a Site Inspection with an engineer.</li>
          <li>We issue a Quotation quote.</li>
          <li>Upon approval, our engineer deploys the solar cell nodes.</li>
          <li>Earn green reward badges!</li>
        </ol>
      </div>

      {/* Right side form */}
      <div className="md:col-span-2 glass-panel p-6 rounded-3xl shadow-glass">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Request Rooftop Solar Setup</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Target Panel Capacity (kW)</label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              >
                <option value="3.0">3.0 kW (Standard Townhouse)</option>
                <option value="5.0">5.0 kW (Suburban Residential)</option>
                <option value="8.0">8.0 kW (Large Residential)</option>
                <option value="12.0">12.0 kW (Small Commercial)</option>
              </select>
            </div>
            <div className="p-3 bg-brand/5 border border-brand/20 rounded-2xl text-center text-xs">
              <span className="text-slate-400">ESTIMATED COST:</span>{' '}
              <span className="font-bold text-brand">₹{estimatedCost}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Street Address</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Renewable Way"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="TX"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Zip Code</label>
              <input
                type="text"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="78701"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
          >
            {loading ? 'Submitting request...' : 'Confirm Solar Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InstallSolar;
