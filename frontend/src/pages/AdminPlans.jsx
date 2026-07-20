import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [pricingType, setPricingType] = useState('Fixed');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/plans', {
        name,
        description,
        ratePerUnit: parseFloat(ratePerUnit),
        pricingType,
        features: ['100% Clean Energy Backed', 'Real-time consumption logs', 'Support coverage'],
      });

      if (res.data.success) {
        toast.success('Energy plan created!');
        setModalOpen(false);
        setName('');
        setDescription('');
        setRatePerUnit('');
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.message || 'Plan creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await api.delete(`/plans/${id}`);
      if (res.data.success) {
        toast.success('Plan removed');
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove plan');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Energy Subscriptions</h2>
          <p className="text-sm text-slate-400 mt-1">Manage grid-wide consumer energy tariffs and packages.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition-all shadow-md shadow-green-500/25"
        >
          <FiPlus /> Create Plan
        </button>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Plan Name</th>
              <th className="px-6 py-4">Pricing Type</th>
              <th className="px-6 py-4">Rate per Unit</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {plans.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4 font-semibold">{p.name}</td>
                <td className="px-6 py-4">{p.pricingType}</td>
                <td className="px-6 py-4 font-bold">₹{p.ratePerUnit.toFixed(3)} / kWh</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-bold">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="rounded-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Plan">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clean Energy Pro"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Description</label>
            <textarea
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter pricing features details..."
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Rate per Unit ($/kWh)</label>
              <input
                type="number"
                required
                step="0.001"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(e.target.value)}
                placeholder="0.085"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Pricing Scheme</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              >
                <option value="Fixed">Fixed</option>
                <option value="Tiered">Tiered</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Creating...' : 'Save Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPlans;
